// DynamoDBを操作するライブラリの読み込み
import { DynamoDBClient, ScanCommand } from "@aws-sdk/client-dynamodb";

const client = new DynamoDBClient();
const TableName = process.env.LikesTableName;

// APIにアクセスがあるとlambdaHandlerと言う名前の関数が呼び出される（変更可能）
export const lambdaHandler = async () => {

  console.log("ok");

  // likesテーブルからデータを取得したい
  const input = {
    TableName: TableName
  };

  try {
    // likesテーブりのデータを全権取得するコマンドを作成
    const command = new ScanCommand(input);
    // 上記コマンドを実行
    const response = await client.send(command);
    console.log(response);

    // 取得したデータが少し特殊な形式になってるので、
    // 扱い易い・見慣れた形式に変換
    const items = response.Items.map(item => ({
      id: item.id.S,
      createdAt: Number(item.createdAt.N),
      createdAtJST: item.createdAtJST.S,
      user: item.user.S
    }));

    // 関数の戻り値として取得したデータをAPI経由で呼び出し元（Lambda→API→ブラウザ）に送る
    // データを body に入れると、APIを経由してブラウザが body の内容を受け取れる
    // statusCode は成功をあらわす 200
    return {
      statusCode: 200,
      // レスポンスヘッダ
      // ブラウザでAPIからのレスポンスを受け取るにはこのヘッダが必要
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET",
      },
      body: JSON.stringify(items)
    };

  } catch (error) {
    // エラーが発生した場合は、エラーメッセージをAPI経由でブラウザに送る
    return {
      statusCode: 500,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET",
      },
      body: JSON.stringify({
        message: error.message
      })
    };
  }
};