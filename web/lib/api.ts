export async function fetchRecommendations(filters: any, chatSummary: any) {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/search`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ filters, chatSummary }),
    });
  
    console.log("API response status:", response.status); // 👈追加
    if (!response.ok) {
      const errText = await response.text();
      console.error("API error body:", errText); // 👈追加
      throw new Error("検索APIの呼び出しに失敗しました");
    }
  
    const data = await response.json();
    return data.recommendations;
  }
  