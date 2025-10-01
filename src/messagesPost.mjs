export const lambdaHandler = async (event, context) => {
  const body = JSON.parse(event.body || "{}");
  const userName = body.userName || "";
  const response = {
    statusCode: 200,
    body: JSON.stringify({
      message: `hello ${userName} !`,
    }),
  };

  return response;
};
