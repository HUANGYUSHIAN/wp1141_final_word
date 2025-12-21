import { NextRequest, NextResponse } from "next/server";

// POST - 使用 Google Places API (New) 搜尋店家
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { textQuery } = body;

    if (!textQuery || typeof textQuery !== "string" || !textQuery.trim()) {
      return NextResponse.json(
        { error: "textQuery 參數為必填" },
        { status: 400 }
      );
    }

    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      console.error("GOOGLE_MAPS_API_KEY 未設置");
      return NextResponse.json(
        { error: "Google Maps API Key 未配置" },
        { status: 500 }
      );
    }

    // 調用 Google Places API (New) Text Search
    const response = await fetch(
      "https://places.googleapis.com/v1/places:searchText",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Goog-Api-Key": apiKey,
          "X-Goog-FieldMask": "places.id,places.googleMapsUri,places.displayName",
        },
        body: JSON.stringify({
          textQuery: textQuery.trim(),
          maxResultCount: 1,
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("Google Places API 錯誤:", response.status, errorData);
      return NextResponse.json(
        { error: "Google Places API 請求失敗", details: errorData },
        { status: response.status }
      );
    }

    const data = await response.json();

    // 檢查是否有結果
    if (data.places && data.places.length > 0 && data.places[0].googleMapsUri) {
      return NextResponse.json({
        success: true,
        googleMapsUri: data.places[0].googleMapsUri,
        displayName: data.places[0].displayName?.text || null,
        placeId: data.places[0].id || null,
      });
    }

    // 沒有找到結果
    return NextResponse.json({
      success: false,
      message: "未找到匹配的店家",
    });
  } catch (error: any) {
    console.error("Error calling Google Places API:", error);
    return NextResponse.json(
      { error: "伺服器錯誤", details: error.message },
      { status: 500 }
    );
  }
}

