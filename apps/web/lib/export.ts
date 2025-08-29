// Export utilities for data tables

export interface ExportField {
  id: string;
  name: string;
  description?: string;
  required?: boolean;
  accessor: (item: any) => any;
  format?: (value: any) => string;
}

export interface ExportOptions {
  format: string;
  fields: string[];
  dateRange?: {
    startDate: string;
    endDate: string;
  };
  includeHeaders: boolean;
}

export class ExportService {
  static convertToCSV(data: any[], fields: ExportField[], includeHeaders = true): string {
    const headers = fields.map((field) => field.name);
    const rows = data.map((item) =>
      fields.map((field) => {
        const value = field.accessor(item);
        const formatted = field.format ? field.format(value) : String(value || '');
        // Escape CSV values that contain commas, quotes, or newlines
        return formatted.includes(',') || formatted.includes('"') || formatted.includes('\n')
          ? `"${formatted.replace(/"/g, '""')}"`
          : formatted;
      })
    );

    const csvContent = includeHeaders
      ? [headers, ...rows].map((row) => row.join(',')).join('\n')
      : rows.map((row) => row.join(',')).join('\n');

    return csvContent;
  }

  static downloadFile(content: string, filename: string, mimeType: string) {
    const blob = new Blob([content], { type: mimeType });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }

  static downloadCSV(data: any[], fields: ExportField[], filename: string, includeHeaders = true) {
    const csvContent = this.convertToCSV(data, fields, includeHeaders);
    this.downloadFile(csvContent, `${filename}.csv`, 'text/csv;charset=utf-8;');
  }

  static async downloadExcel(data: any[], fields: ExportField[], filename: string) {
    // This would require a library like xlsx in a real implementation
    // For now, fall back to CSV
    const csvContent = this.convertToCSV(data, fields, true);
    this.downloadFile(csvContent, `${filename}.csv`, 'application/vnd.ms-excel');
  }

  static generatePrintableHTML(data: any[], fields: ExportField[], title: string): string {
    const headers = fields.map((field) => `<th>${field.name}</th>`).join('');
    const rows = data
      .map((item) => {
        const cells = fields
          .map((field) => {
            const value = field.accessor(item);
            const formatted = field.format ? field.format(value) : String(value || '');
            return `<td>${formatted}</td>`;
          })
          .join('');
        return `<tr>${cells}</tr>`;
      })
      .join('');

    return `
<!DOCTYPE html>
<html>
<head>
    <title>${title}</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; }
        h1 { color: #333; margin-bottom: 30px; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f5f5f5; font-weight: bold; }
        tr:nth-child(even) { background-color: #f9f9f9; }
        .header { margin-bottom: 20px; }
        .timestamp { color: #666; font-size: 12px; }
        @media print {
            button { display: none; }
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>${title}</h1>
        <div class="timestamp">Generated on ${new Date().toLocaleString()}</div>
    </div>
    <table>
        <thead>
            <tr>${headers}</tr>
        </thead>
        <tbody>
            ${rows}
        </tbody>
    </table>
    <script>
        window.onload = function() {
            window.print();
        };
    </script>
</body>
</html>`;
  }

  static printData(data: any[], fields: ExportField[], title: string) {
    const htmlContent = this.generatePrintableHTML(data, fields, title);
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(htmlContent);
      printWindow.document.close();
    }
  }
}

// Common field definitions for different data types
export const PackageFields: ExportField[] = [
  {
    id: 'trackingNumber',
    name: 'Tracking Number',
    required: true,
    accessor: (pkg) => pkg.trackingNumber || pkg.barcode,
  },
  { id: 'customer', name: 'Customer', accessor: (pkg) => pkg.shipTo?.name || 'Unknown' },
  { id: 'status', name: 'Status', accessor: (pkg) => pkg.shipmentStatus || 'ready' },
  {
    id: 'destination',
    name: 'Destination',
    accessor: (pkg) => `${pkg.shipTo?.city}, ${pkg.shipTo?.province}`,
  },
  { id: 'weight', name: 'Weight (kg)', accessor: (pkg) => pkg.weight || 0 },
  {
    id: 'receivedDate',
    name: 'Received Date',
    accessor: (pkg) => pkg.receivedDate,
    format: (date) => new Date(date).toLocaleDateString(),
  },
  {
    id: 'expectedDelivery',
    name: 'Expected Delivery',
    accessor: (pkg) => pkg.expectedDeliveryDate,
    format: (date) => (date ? new Date(date).toLocaleDateString() : 'TBD'),
  },
  {
    id: 'loadId',
    name: 'Load ID',
    accessor: (pkg) => (pkg.loadId ? `#${pkg.loadId.slice(-6)}` : 'Unassigned'),
  },
];

export const CustomerFields: ExportField[] = [
  {
    id: 'name',
    name: 'Name',
    required: true,
    accessor: (customer) => `${customer.firstName} ${customer.lastName}`,
  },
  { id: 'email', name: 'Email', required: true, accessor: (customer) => customer.email },
  { id: 'phone', name: 'Phone', accessor: (customer) => customer.phone || '' },
  {
    id: 'address',
    name: 'Address',
    accessor: (customer) => `${customer.addressLine1}, ${customer.city}, ${customer.province}`,
  },
  { id: 'status', name: 'Status', accessor: (customer) => customer.status || 'active' },
  {
    id: 'createdAt',
    name: 'Created Date',
    accessor: (customer) => customer.createdAt,
    format: (date) => new Date(date).toLocaleDateString(),
  },
];

export const LoadFields: ExportField[] = [
  {
    id: 'loadId',
    name: 'Load ID',
    required: true,
    accessor: (load) => `#${load.id?.slice(-6) || 'N/A'}`,
  },
  { id: 'driver', name: 'Driver', accessor: (load) => load.driverName || 'Unassigned' },
  { id: 'status', name: 'Status', accessor: (load) => load.status || 'planned' },
  {
    id: 'departureDate',
    name: 'Departure Date',
    accessor: (load) => load.departureDate,
    format: (date) => (date ? new Date(date).toLocaleDateString() : 'TBD'),
  },
  { id: 'packageCount', name: 'Package Count', accessor: (load) => load.packageCount || 0 },
  {
    id: 'destinations',
    name: 'Destinations',
    accessor: (load) =>
      load.destinationInfo?.cities
        ?.map((city: any) => `${city.city}, ${city.province}`)
        .join('; ') || 'None',
  },
];

export const InvoiceFields: ExportField[] = [
  {
    id: 'invoiceNumber',
    name: 'Invoice #',
    required: true,
    accessor: (invoice) => invoice.invoiceNumber,
  },
  {
    id: 'customerName',
    name: 'Customer',
    accessor: (invoice) => invoice.customerName || 'Unknown',
  },
  {
    id: 'amount',
    name: 'Amount',
    accessor: (invoice) => invoice.amount,
    format: (amount) => `CAD $${(amount / 100).toFixed(2)}`,
  },
  { id: 'status', name: 'Status', accessor: (invoice) => invoice.status },
  {
    id: 'createdAt',
    name: 'Created Date',
    accessor: (invoice) => invoice.createdAt,
    format: (date) => new Date(date).toLocaleDateString(),
  },
  {
    id: 'paidAt',
    name: 'Paid Date',
    accessor: (invoice) => invoice.paidAt,
    format: (date) => (date ? new Date(date).toLocaleDateString() : 'Unpaid'),
  },
];
