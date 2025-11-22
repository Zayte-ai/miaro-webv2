import { NextRequest, NextResponse } from 'next/server';

// Generate CSV data for analytics export
const generateCSVData = (range: string) => {
  const now = new Date();
  const rangeData = {
    '7d': { days: 7, label: 'Last 7 Days' },
    '30d': { days: 30, label: 'Last 30 Days' },
    '90d': { days: 90, label: 'Last 90 Days' },
    '1y': { days: 365, label: 'Last Year' },
  };

  const { days, label } = rangeData[range as keyof typeof rangeData] || rangeData['7d'];

  // Generate sample data
  const csvRows = [
    ['Date', 'Sales ($)', 'Orders', 'Customers', 'Avg Order Value ($)', 'Conversion Rate (%)'].join(','),
  ];

  for (let i = days; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);

    const sales = Math.floor(800 + Math.sin((i / days) * Math.PI * 2) * 400 + (Math.random() - 0.5) * 200);
    const orders = Math.floor(sales / (120 + Math.random() * 80));
    const customers = Math.floor(orders * (0.7 + Math.random() * 0.3));
    const avgOrderValue = Math.round((sales / orders) * 100) / 100;
    const conversionRate = Math.round((customers / (customers + Math.floor(Math.random() * 100))) * 1000) / 10;

    csvRows.push([
      date.toISOString().split('T')[0],
      sales.toString(),
      orders.toString(),
      customers.toString(),
      avgOrderValue.toString(),
      conversionRate.toString(),
    ].join(','));
  }

  return {
    filename: `maisonmiaro-analytics-${range}-${now.toISOString().split('T')[0]}.csv`,
    content: csvRows.join('\n'),
    label,
  };
};

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const range = searchParams.get('range') || '7d';

    // Validate range parameter
    const validRanges = ['7d', '30d', '90d', '1y'];
    if (!validRanges.includes(range)) {
      return NextResponse.json(
        { error: 'Invalid range parameter' },
        { status: 400 }
      );
    }

    const csvData = generateCSVData(range);

    // Return CSV file
    return new NextResponse(csvData.content, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${csvData.filename}"`,
        'Cache-Control': 'no-cache',
      },
    });
  } catch (error) {
    console.error('Analytics export API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Also support POST for more complex export options
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { range = '7d', format = 'csv', includeCategories = false, includeProducts = false } = body;

    // Validate range parameter
    const validRanges = ['7d', '30d', '90d', '1y'];
    if (!validRanges.includes(range)) {
      return NextResponse.json(
        { error: 'Invalid range parameter' },
        { status: 400 }
      );
    }

    let csvData = generateCSVData(range);

    // Add additional data if requested
    if (includeCategories || includeProducts) {
      // This would fetch and include additional data in a real implementation
      csvData.content += '\n\n# Additional data would be included here';
    }

    if (format === 'json') {
      // Return JSON format instead of CSV
      const jsonData = {
        range,
        exported_at: new Date().toISOString(),
        data: csvData.content.split('\n').slice(1).map(row => {
          const values = row.split(',');
          return {
            date: values[0],
            sales: parseFloat(values[1]),
            orders: parseInt(values[2]),
            customers: parseInt(values[3]),
            avgOrderValue: parseFloat(values[4]),
            conversionRate: parseFloat(values[5]),
          };
        }),
      };

      return NextResponse.json(jsonData);
    }

    // Return CSV file
    return new NextResponse(csvData.content, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${csvData.filename}"`,
        'Cache-Control': 'no-cache',
      },
    });
  } catch (error) {
    console.error('Analytics export API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
