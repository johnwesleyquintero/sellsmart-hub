import { NextResponse } from "next/server";
import { z } from "zod";

const subscribeSchema = z.object({
  email: z.string().email(),
  tags: z.array(z.string()).optional(),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, tags } = subscribeSchema.parse(body);

    // Add your newsletter service integration here (e.g., ConvertKit, Mailchimp)
    const response = await fetch("YOUR_NEWSLETTER_SERVICE_API", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.NEWSLETTER_API_KEY}`,
      },
      body: JSON.stringify({ email, tags }),
    });

    if (!response.ok) throw new Error("Newsletter subscription failed");

    return NextResponse.json({
      success: true,
      message: "Successfully subscribed to newsletter",
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: "Subscription failed" },
      { status: 400 },
    );
  }
}
