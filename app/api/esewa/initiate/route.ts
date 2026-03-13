import { NextResponse } from "next/server";
import crypto from "crypto";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function generateEsewaSignature({
  totalAmount,
  transactionUuid,
  productCode,
  secretKey,
}: {
  totalAmount: string;
  transactionUuid: string;
  productCode: string;
  secretKey: string;
}) {
  const message = `total_amount=${totalAmount},transaction_uuid=${transactionUuid},product_code=${productCode}`;

  return crypto
    .createHmac("sha256", secretKey)
    .update(message)
    .digest("base64");
}

export async function POST(request: Request) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: auth } = await supabase.auth.getUser();

    if (!auth.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const classId = Number(body.classId);

    if (!classId) {
      return NextResponse.json({ error: "classId is required" }, { status: 400 });
    }

    const productCode = process.env.ESEWA_PRODUCT_CODE!;
    const secretKey = process.env.ESEWA_SECRET_KEY!;
    const formUrl = process.env.ESEWA_FORM_URL!;
    const appUrl = process.env.NEXT_PUBLIC_APP_URL!;

    const totalAmount = "100";
    const transactionUuid = `class-${classId}-${Date.now()}`;

    const signature = generateEsewaSignature({
      totalAmount,
      transactionUuid,
      productCode,
      secretKey,
    });

    const successUrl = `${appUrl}/payment/esewa/success`;
    const failureUrl = `${appUrl}/payment/esewa/failure`;

    const payload = {
      formUrl,
      fields: {
        amount: totalAmount,
        tax_amount: "0",
        total_amount: totalAmount,
        transaction_uuid: transactionUuid,
        product_code: productCode,
        product_service_charge: "0",
        product_delivery_charge: "0",
        success_url: successUrl,
        failure_url: failureUrl,
        signed_field_names: "total_amount,transaction_uuid,product_code",
        signature,
      },
    };

    // 🔎 DEBUG LOG
    console.log("====== ESEWA INIT PAYLOAD ======");
    console.log(JSON.stringify(payload, null, 2));
    console.log("================================");

    return NextResponse.json(payload);

  } catch (error) {
    console.error("eSewa initiate error:", error);

    return NextResponse.json(
      { error: "Failed to initiate eSewa payment" },
      { status: 500 }
    );
  }
}