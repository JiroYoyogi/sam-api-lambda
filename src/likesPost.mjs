// DynamoDBを操作するライブラリの読み込み
import { DynamoDBClient, PutItemCommand } from "@aws-sdk/client-dynamodb";
// ランダムなID（UUID）を作成するライブラリの読み込み
import { randomUUID } from "crypto";

const client = new DynamoDBClient();
const TableName = process.env.LikesTableName;

// APIにアクセスがあるとlambdaHandlerと言う名前の関数が呼び出される（変更可能）
export const lambdaHandler = async (event) => {
  console.log("Hello, Lambda ! from likes-post");
  console.log(event);
  // ランダムなID（UUID）を作成
  const id = randomUUID();
  const d = new Date();
  // UNIXタイムスタンプ（ミリ秒）
  const timestamp = d.getTime();
  // ”いいね”された時間を日本時間で保存したい
  const jstTime = d.toLocaleString("ja-JP", {
    timeZone: "Asia/Tokyo",
    hour12: false,
  });
  // クライアントJSから送信された user を取得
  const eventBody = event.body ? JSON.parse(event.body) : {};
  const userName = eventBody.user ? eventBody.user : "No Name";

  const input = {
    TableName: TableName,
    Item: {
      id: {
        // S は id が文字列（string）であると言う意味
        S: id,
      },
      createdAt: {
        // N は timestamp が数値（number）であると言う意味
        // 本当は、数値のまま使いたいが、文字列に変換してDBに保存しないといけない仕様...
        N: String(timestamp)
      },
      createdAtJST: {
        S: jstTime
      },
      user: {
        S: userName
      }
    }
  };

  try {
    // inputの内容をDynamoDBに保存するコマンド作成
    const command = new PutItemCommand(input);
    // inputの内容をDynamoDBに保存するコマンド実行
    await client.send(command);

    // 関数の戻り値として"success"と言う文字を呼び出し元（Lambda→API→ブラウザ）に送る
    return {
      statusCode: 200,
      // レスポンスヘッダ
      // ブラウザでAPIからのレスポンスを受け取るにはこのヘッダが必要
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST",
      },
      body: JSON.stringify({
        message: "success"
      })
    }
  } catch( error) {
    // エラーが発生した場合は、エラーメッセージをAPI経由でブラウザに送る
    return {
      statusCode: 500,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST",
      },
      body: JSON.stringify({
        message: error.message
      }),
    }
  }
}