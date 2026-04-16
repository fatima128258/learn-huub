import { NextResponse } from "next/server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req) {
  try {
    const { to, subject, text, adminEmail } = await req.json();

    if (!to || !subject || !text) {
      return NextResponse.json(
        { success: false, message: "All fields are required" },
        { status: 400 }
      );
    }

    // Send email via Resend
    await resend.emails.send({
      from: "Learn Hub <onboarding@resend.dev>",
      to: [to],
      subject: subject,
      html: `
    <p>${text}</p>
    <br/>
    <p>Regards,<br/>Admin Team</p>
  `,
      reply_to: adminEmail || "onboarding@resend.dev",
    });

    return NextResponse.json({
      success: true,
      message: "Email sent successfully",
    });

  } catch (error) {
    console.error("Resend email error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to send email" },
      { status: 500 }
    );
  }
}




// import { NextResponse } from "next/server";
// import { Resend } from "resend";

// const RESEND_API_KEY = process.env.RESEND_API_KEY;
// const resend = RESEND_API_KEY ? new Resend(RESEND_API_KEY) : null;

// export async function POST(req) {
//   try {
//     const { to, subject, text, adminEmail } = await req.json();

//     if (!to || !subject || !text) {
//       return NextResponse.json(
//         { success: false, message: "All fields are required" },
//         { status: 400 }
//       );
//     }

//     if (!RESEND_API_KEY) {
//       return NextResponse.json(
//         { success: false, message: "Missing RESEND_API_KEY. Configure email provider or update env." },
//         { status: 500 }
//       );
//     }

//     // Send email via Resend
//     const result = await resend.emails.send({
//       from: "Learn Hub <onboarding@resend.dev>",
//       to: [to],
//       subject: subject,
//       html: `
//     <p>${text}</p>
//     <br/>
//     <p>Regards,<br/>Admin Team</p>
//   `,
//       reply_to: adminEmail || "onboarding@resend.dev",
//     });

//     return NextResponse.json({
//       success: true,
//       message: "Email sent successfully",
//       id: result?.data?.id || null,
//     });

//   } catch (error) {
//     const message = (error && (error.message || error.name)) ? String(error.message || error.name) : "Failed to send email";
//     console.error("Resend email error:", error);
//     return NextResponse.json(
//       { success: false, message },
//       { status: 500 }
//     );
//   }
// }
