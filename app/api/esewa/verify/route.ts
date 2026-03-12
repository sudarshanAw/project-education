import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const encodedData = body.data as string | undefined;

    if (!encodedData) {
      return NextResponse.json(
        { error: "Missing eSewa response data" },
        { status: 400 }
      );
    }

    const decodedString = Buffer.from(encodedData, "base64").toString("utf-8");
    const decoded = JSON.parse(decodedString);

    const productCode = decoded.product_code;
    const totalAmount = decoded.total_amount;
    const transactionUuid = decoded.transaction_uuid;

    if (!productCode || !totalAmount || !transactionUuid) {
      return NextResponse.json(
        { error: "Invalid eSewa success payload" },
        { status: 400 }
      );
    }

    const statusUrlBase = process.env.ESEWA_STATUS_URL;

    if (!statusUrlBase) {
      return NextResponse.json(
        { error: "Missing ESEWA_STATUS_URL" },
        { status: 500 }
      );
    }

    const statusUrl =
      `${statusUrlBase}?product_code=${encodeURIComponent(productCode)}` +
      `&total_amount=${encodeURIComponent(String(totalAmount))}` +
      `&transaction_uuid=${encodeURIComponent(String(transactionUuid))}`;

    const res = await fetch(statusUrl, {
      method: "GET",
      cache: "no-store",
    });

    const verifyData = await res.json();

    if (!res.ok) {
      return NextResponse.json(
        {
          error:
            verifyData?.error_message || "Failed to verify eSewa transaction",
        },
        { status: 400 }
      );
    }

    if (verifyData?.status !== "COMPLETE") {
      return NextResponse.json(
        {
          error: `Payment not complete: ${verifyData?.status || "UNKNOWN"}`,
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      ok: true,
      message: "Payment verified successfully",
      payment: decoded,
      verification: verifyData,
    });
  } catch (error) {
    console.error("eSewa verify error:", error);

    return NextResponse.json(
      { error: "Failed to verify payment" },
      { status: 500 }
    );
  }
}