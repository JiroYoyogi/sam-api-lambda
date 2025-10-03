export const lambdaHandler = async (event, context) => {
  // POSTリクエストのBodyを取得
  // { "userName": "taro" } のようなJSONが送られてくる想定
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
