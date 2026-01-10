
export default async function handler(req, res) {
  // Add CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { to, subject, html } = req.body;

  if (!to || !subject || !html) {
    return res.status(400).json({ message: 'Missing required fields' });
  }

  const RESEND_API_KEY = "re_3R8KpRr6_Dim7B3YBQ3kmEHbGPFx7FAvQ";
  const fromEmail = process.env.RESEND_FROM_EMAIL || "contracts@acesolutions.digital";

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: `PPC Contracts <${fromEmail}>`,
        to: Array.isArray(to) ? to : [to],
        subject,
        html,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Resend API error:", data);
      
      // Provide a very specific error if it's a domain verification issue
      if (data.message && data.message.includes("not verified")) {
        return res.status(403).json({ 
          message: `Domain Verification Required: The email domain '${fromEmail.split('@')[1]}' must be verified in your Resend dashboard (https://resend.com/domains) before you can send emails.`,
          suggestion: "Please verify your domain or set the RESEND_FROM_EMAIL environment variable to a verified domain."
        });
      }
      
      return res.status(response.status).json(data);
    }

    return res.status(200).json(data);
  } catch (error) {
    console.error("Serverless function error:", error);
    return res.status(500).json({ message: error.message });
  }
}
