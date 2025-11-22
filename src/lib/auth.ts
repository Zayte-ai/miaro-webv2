import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from './db';

export interface AuthTokenPayload {
  userId: string;
  email: string;
  isAdmin?: boolean;
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}

export function generateToken(payload: AuthTokenPayload): string {
  return jwt.sign(payload, process.env.JWT_SECRET!, { expiresIn: '7d' });
}

export function verifyToken(token: string): AuthTokenPayload | null {
  try {
    return jwt.verify(token, process.env.JWT_SECRET!) as AuthTokenPayload;
  } catch {
    return null;
  }
}

export async function authenticateUser(email: string, password: string) {
  try {
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user) {
      return { success: false, message: 'Invalid email or password' };
    }

    if (!user.isActive) {
      return { success: false, message: 'Account has been deactivated' };
    }

    const isValidPassword = await verifyPassword(password, user.passwordHash);
    if (!isValidPassword) {
      return { success: false, message: 'Invalid email or password' };
    }

    const token = generateToken({
      userId: user.id,
      email: user.email,
      isAdmin: user.isAdmin,
    });

    const { passwordHash, ...userWithoutPassword } = user;

    return {
      success: true,
      user: userWithoutPassword,
      token,
    };
  } catch (error) {
    console.error('Authentication error:', error);
    return { success: false, message: 'Authentication failed' };
  }
}

export async function authenticateAdmin(email: string, password: string) {
  try {
    const admin = await prisma.admin.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!admin) {
      return { success: false, message: 'Invalid email or password' };
    }

    if (!admin.isActive) {
      return { success: false, message: 'Account has been deactivated' };
    }

    const isValidPassword = await verifyPassword(password, admin.passwordHash);
    if (!isValidPassword) {
      return { success: false, message: 'Invalid email or password' };
    }

    await prisma.admin.update({
      where: { id: admin.id },
      data: { lastLoginAt: new Date() },
    });

    const token = generateToken({
      userId: admin.id,
      email: admin.email,
      isAdmin: true,
    });

    const { passwordHash, ...adminWithoutPassword } = admin;

    return {
      success: true,
      user: adminWithoutPassword,
      token,
    };
  } catch (error) {
    console.error('Admin authentication error:', error);
    return { success: false, message: 'Authentication failed' };
  }
}

export async function registerUser(userData: {
  email: string;
  firstName: string;
  lastName: string;
  password: string;
  phone?: string;
}) {
  try {
    const existingUser = await prisma.user.findUnique({
      where: { email: userData.email.toLowerCase() },
    });

    if (existingUser) {
      return { success: false, message: 'Email already registered' };
    }

    const hashedPassword = await hashPassword(userData.password);

    const user = await prisma.user.create({
      data: {
        email: userData.email.toLowerCase(),
        firstName: userData.firstName,
        lastName: userData.lastName,
        phone: userData.phone,
        passwordHash: hashedPassword,
      },
    });

    const token = generateToken({
      userId: user.id,
      email: user.email,
    });

    const { passwordHash, ...userWithoutPassword } = user;

    return {
      success: true,
      user: userWithoutPassword,
      token,
    };
  } catch (error) {
    console.error('Registration error:', error);
    return { success: false, message: 'Registration failed' };
  }
}

export async function generatePasswordResetToken(email: string) {
  try {
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user) {
      // Don't reveal if email exists for security
      return { success: true, message: 'If the email exists, a reset link has been sent' };
    }

    const resetToken = jwt.sign({ userId: user.id }, process.env.JWT_SECRET!, { expiresIn: '1h' });
    const resetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetPasswordToken: resetToken,
        resetPasswordExpires: resetExpires,
      },
    });

    return {
      success: true,
      resetToken,
      message: 'Password reset token generated',
    };
  } catch (error) {
    console.error('Password reset token generation error:', error);
    return { success: false, message: 'Failed to generate reset token' };
  }
}

export async function resetPassword(token: string, newPassword: string) {
  try {
    const decoded = verifyToken(token);
    if (!decoded) {
      return { success: false, message: 'Invalid or expired token' };
    }

    const user = await prisma.user.findUnique({
      where: {
        id: decoded.userId,
        resetPasswordToken: token,
        resetPasswordExpires: { gt: new Date() },
      },
    });

    if (!user) {
      return { success: false, message: 'Invalid or expired token' };
    }

    const hashedPassword = await hashPassword(newPassword);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash: hashedPassword,
        resetPasswordToken: null,
        resetPasswordExpires: null,
      },
    });

    return { success: true, message: 'Password reset successfully' };
  } catch (error) {
    console.error('Password reset error:', error);
    return { success: false, message: 'Failed to reset password' };
  }
}