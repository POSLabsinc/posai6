import { supabase } from "@/integrations/supabase/client";

interface EodReportData {
  date: string;
  totalOrders: number;
  paidOrders: number;
  unpaidOrders: number;
  cancelledOrders: number;
  closedOrders: number;
  totalSales: number;
  employees?: {
    name: string;
    role: string;
    hourlyRate: number;
  }[];
}

function formatCurrency(amount: number): string {
  return `£${amount.toFixed(2)}`;
}

function buildReportHtml(data: EodReportData, includeEmployeeData: boolean): string {
  const employeeSection = includeEmployeeData && data.employees && data.employees.length > 0
    ? `
      <div style="margin-top:24px;">
        <h3 style="font-size:14px;font-weight:600;margin-bottom:12px;border-bottom:1px solid #333;padding-bottom:6px;">Employee Data</h3>
        <table style="width:100%;border-collapse:collapse;font-size:12px;">
          <thead>
            <tr style="border-bottom:1px solid #444;">
              <th style="text-align:left;padding:6px 4px;">Name</th>
              <th style="text-align:left;padding:6px 4px;">Role</th>
              <th style="text-align:right;padding:6px 4px;">Hourly Rate</th>
            </tr>
          </thead>
          <tbody>
            ${data.employees.map(emp => `
              <tr style="border-bottom:1px solid #eee;">
                <td style="padding:6px 4px;">${emp.name}</td>
                <td style="padding:6px 4px;">${emp.role}</td>
                <td style="text-align:right;padding:6px 4px;">${formatCurrency(emp.hourlyRate)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `
    : '';

  return `
    <!DOCTYPE html>
    <html>
    <head><title>End of Day Report - ${data.date}</title></head>
    <body style="font-family:system-ui,-apple-system,sans-serif;max-width:400px;margin:0 auto;padding:24px;color:#111;">
      <h2 style="text-align:center;font-size:18px;margin-bottom:4px;">End of Day Report</h2>
      <p style="text-align:center;color:#666;font-size:13px;margin-bottom:24px;">${data.date}</p>
      
      <div style="margin-bottom:20px;">
        <h3 style="font-size:14px;font-weight:600;margin-bottom:12px;border-bottom:1px solid #333;padding-bottom:6px;">Order Summary</h3>
        <div style="display:flex;justify-content:space-between;padding:4px 0;font-size:13px;">
          <span>Total Orders</span><span style="font-weight:600;">${data.totalOrders}</span>
        </div>
        <div style="display:flex;justify-content:space-between;padding:4px 0;font-size:13px;">
          <span>Paid Orders</span><span style="font-weight:600;">${data.paidOrders}</span>
        </div>
        <div style="display:flex;justify-content:space-between;padding:4px 0;font-size:13px;">
          <span>Unpaid Orders</span><span style="font-weight:600;">${data.unpaidOrders}</span>
        </div>
        <div style="display:flex;justify-content:space-between;padding:4px 0;font-size:13px;">
          <span>Cancelled Orders</span><span style="font-weight:600;">${data.cancelledOrders}</span>
        </div>
        <div style="display:flex;justify-content:space-between;padding:4px 0;font-size:13px;">
          <span>Closed Orders</span><span style="font-weight:600;">${data.closedOrders}</span>
        </div>
      </div>

      <div style="margin-bottom:20px;">
        <h3 style="font-size:14px;font-weight:600;margin-bottom:12px;border-bottom:1px solid #333;padding-bottom:6px;">Sales</h3>
        <div style="display:flex;justify-content:space-between;padding:4px 0;font-size:14px;font-weight:600;">
          <span>Total Sales</span><span>${formatCurrency(data.totalSales)}</span>
        </div>
      </div>

      ${employeeSection}

      <p style="text-align:center;color:#999;font-size:11px;margin-top:32px;">Generated automatically by POS AI</p>
    </body>
    </html>
  `;
}

export async function printEndOfDayReport(
  orders: any[],
  includeEmployeeData: boolean
): Promise<void> {
  const today = new Date().toLocaleDateString('en-GB', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const reportData: EodReportData = {
    date: today,
    totalOrders: orders.length,
    paidOrders: orders.filter(o => o.status === "PAID" || o.status === "Closed").length,
    unpaidOrders: orders.filter(o => o.status === "UNPAID" || o.status === "UN PAID").length,
    cancelledOrders: orders.filter(o => o.status === "Cancelled").length,
    closedOrders: orders.filter(o => o.status === "Closed").length,
    totalSales: orders
      .filter(o => o.status === "PAID" || o.status === "Closed")
      .reduce((sum, o) => sum + (o.total || 0), 0),
  };

  if (includeEmployeeData) {
    try {
      const { data: employees } = await supabase
        .from("employees")
        .select("full_name, role, hourly_rate")
        .eq("is_archived", false)
        .order("full_name");

      reportData.employees = (employees || []).map((e: any) => ({
        name: e.full_name,
        role: e.role,
        hourlyRate: e.hourly_rate,
      }));
    } catch {
      // If fetch fails, skip employee data
    }
  }

  const html = buildReportHtml(reportData, includeEmployeeData);

  const printWindow = window.open('', '_blank', 'width=500,height=700');
  if (printWindow) {
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 500);
  }
}
