const { getStore } = require("@netlify/blobs");

exports.handler = async (event, context) => {
  // Verify Netlify Identity Authentication
  const user = context.clientContext && context.clientContext.user;
  if (!user) {
    return {
      statusCode: 401,
      body: JSON.stringify({ error: "Unauthorized. Please log in." })
    };
  }

  try {
    // Initialize Blob store
    const store = getStore("cards-store");
    
    // Fallback default cards if store is empty
    const defaultCards = [
      "Chase Freedom Unlimited",
      "Chase Freedom Flex",
      "Chase Sapphire Preferred",
      "Chase Amazon Prime Visa",
      "Discover IT Card",
      "Apple Card",
      "Bank of America Unlimited Rewards",
      "Bank of America Travel Rewards",
      "Bilt Blue Card",
      "Amex Gold",
      "Amex Blue Cash Everyday"
    ];

    if (event.httpMethod === "GET") {
      let cards = await store.get("portfolio", { type: "json" });
      if (!cards) {
        cards = defaultCards;
        // Optionally save the defaults so they persist immediately
        await store.setJSON("portfolio", cards);
      }
      return {
        statusCode: 200,
        body: JSON.stringify({ cards })
      };
    } 
    
    if (event.httpMethod === "POST") {
      const data = JSON.parse(event.body);
      if (data.cards && Array.isArray(data.cards)) {
        await store.setJSON("portfolio", data.cards);
        return {
          statusCode: 200,
          body: JSON.stringify({ success: true })
        };
      }
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Invalid data format" })
      };
    }

    return {
      statusCode: 405,
      body: JSON.stringify({ error: "Method not allowed" })
    };

  } catch (error) {
    console.error("Cards Function Error:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Internal Server Error" })
    };
  }
};
