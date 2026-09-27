exports.handler = async function () {
  return {
    statusCode: 200,
    headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
    body: JSON.stringify({
      status: "operational",
      network: "testnet",
      mode: "sandbox",
      timestamp: new Date().toISOString()
    })
  };
};
