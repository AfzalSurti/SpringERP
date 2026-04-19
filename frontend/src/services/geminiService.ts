export const analyzeFinancialHealth = async (data: any[]): Promise<string> => {
  const totalAmount = data.reduce((sum, item) => sum + (item.amount ?? 0), 0);
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(`- Revenue records captured: ${data.length}.
- Current booked value in the system is ₹${totalAmount.toLocaleString('en-IN')}.
- Highest priority remains improving conversion on open CRM opportunities.
- Keep cash visibility strong across invoicing, inventory, and payroll.`);
    }, 1500);
  });
};

export const generateCustomerEmail = async (customer: any, context: string): Promise<string> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(`Subject: SmartBiz Follow-up: ${customer.companyName ?? customer.company} & Next Steps

Hi ${customer.firstName ?? customer.name},

I hope you're having a productive week.

I wanted to quickly follow up regarding our previous discussions and your current status at ${customer.stage}.
${context}

Our analytics indicate that your account profile representing ₹${(customer.value ?? 0).toLocaleString('en-IN')} remains a high priority for our strategic alignment.

Please let me know a convenient time to reconnect.

Best,
SmartBiz Team`);
    }, 1200);
  });
};
