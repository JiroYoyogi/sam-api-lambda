# DynamoDB作成

Parameters

```yaml
Parameters:
  # 作成するDynamoDBのテーブル名
  LikesTableName:
    Type: String
```

DynamoDB

```yaml
  # https://docs.aws.amazon.com/AWSCloudFormation/latest/TemplateReference/aws-resource-dynamodb-table.html
  LikesTable:
    Type: AWS::DynamoDB::Table
    Properties:
      # Parametersで受け取ったテーブル名をTableNameとしてセット
      TableName: !Ref LikesTableName
      # idをパーティションキー（HASH）として使う
      KeySchema:
        - AttributeName: id
          KeyType: HASH
      # キーの型を定義
      AttributeDefinitions:
        - AttributeName: id
          AttributeType: S
      # オンデマンドで課金。デフォルトはPROVISIONED
      BillingMode: PAY_PER_REQUEST
```

ビルド

```
sam build
```

デプロイ

```
sam deploy --guided
```

AWS上にDynamoDBテーブルが作成されてることを確認

# "いいね"をGET・POSTするLambda作成

## 作るもの

- "いいね"をGETするLambda
- "いいね"をPOSTするLambda
- LambdaにDynamoDBの操作権限を与えるIAM

## コード変更・追加

- temaplate.yaml

```yaml
AWSTemplateFormatVersion: '2010-09-09'
Transform: AWS::Serverless-2016-10-31
Description: >
  SAM Template for sam-api-lambda

Parameters:
  # 作成するDynamoDBのテーブル名
  LikesTableName:
    Type: String
  
Globals:
  Function:
    Timeout: 30
    Environment:
      Variables:
        # Parametersで受け取ったテーブル名をLambdaの環境変数にセット
        LikesTableName: !Ref LikesTableName
  # Api:
  #   OpenApiVersion: 3.0.2
  #   # プリフライトリクエスト対応
  #   Cors:
  #     AllowMethods: "'GET,POST,OPTIONS'"
  #     AllowHeaders: "'Content-Type'"
  #     AllowOrigin: "'*'"

Resources:
  # DynamoDB
  # https://docs.aws.amazon.com/AWSCloudFormation/latest/TemplateReference/aws-resource-dynamodb-table.html
  LikesTable:
    Type: AWS::DynamoDB::Table
    Properties:
      # Parametersで受け取ったテーブル名をTableNameとしてセット
      TableName: !Ref LikesTableName
      # idをパーティションキー（HASH）として使う
      KeySchema:
        - AttributeName: id
          KeyType: HASH
      # キーの型を定義
      AttributeDefinitions:
        - AttributeName: id
          AttributeType: S
      # オンデマンドで課金。デフォルトはPROVISIONED
      BillingMode: PAY_PER_REQUEST

  # LambdaにDynamoDBの操作権限を与えるIAM
  # https://docs.aws.amazon.com/AWSCloudFormation/latest/TemplateReference/aws-resource-iam-role.html
  LikesFunctionRole:
    Type: AWS::IAM::Role
    Properties:
      AssumeRolePolicyDocument:
        Version: "2012-10-17"
        Statement:
          - Effect: Allow
            Principal:
              Service: lambda.amazonaws.com
            Action: sts:AssumeRole
      # LambdaがCloudWatch Logsにも書けるようにする（基本ポリシー）
      ManagedPolicyArns:
        - arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole
      Policies:
        - PolicyName: DynamoDBAccessPolicy
          PolicyDocument:
            Version: "2012-10-17"
            Statement:
              - Effect: Allow
                Action:
                  - dynamodb:Scan
                  - dynamodb:GetItem
                  - dynamodb:PutItem
                # LikesTabeに対する上記操作を許可
                Resource: !GetAtt LikesTable.Arn

  # "いいね"をGETするLambda
  LikesGetFunction:
    Type: AWS::Serverless::Function
    Properties:
      # srcディレクトリ
      CodeUri: src/
      # CodeUriに指定したディレクトリにある
      # likesGetというファイル内のlambdaHandlerという関数を呼ぶ
      Handler: likesGet.lambdaHandler
      Runtime: nodejs22.x
      Architectures:
        - x86_64
      Role: !GetAtt LikesFunctionRole.Arn
      Events:
        MessagesGet:
          Type: Api
          Properties:
            # likesに対してのGETリクエストを受け付けるAPIパス
            Path: /likes
            Method: get

  LikesPostFunction:
    Type: AWS::Serverless::Function
    Properties:
      # srcディレクトリ
      CodeUri: src/
      # CodeUriに指定したディレクトリにある
      # likesPostというファイル内のlambdaHandlerという関数を呼ぶ
      Handler: likesPost.lambdaHandler
      Runtime: nodejs22.x
      Architectures:
        - x86_64
      Role: !GetAtt LikesFunctionRole.Arn
      Events:
        MessagesGet:
          Type: Api
          Properties:
            # likesに対してのGETリクエストを受け付けるAPIパス
            Path: /likes
            Method: post

  MessagesGetFunction:
    Type: AWS::Serverless::Function
    Properties:
      # srcディレクトリ
      CodeUri: src/
      # CodeUriに指定したディレクトリにある
      # messagesGetというファイル内のlambdaHandlerという関数を呼ぶ
      Handler: messagesGet.lambdaHandler
      Runtime: nodejs22.x
      Architectures:
        - x86_64
      Events:
        MessagesGet:
          Type: Api
          Properties:
            # messagesに対してのGETリクエストを受け付けるAPIパス
            Path: /messages
            Method: get

  MessagesPostFunction:
    Type: AWS::Serverless::Function
    Properties:
      CodeUri: src/
      # CodeUriに指定したディレクトリにある
      # messagesPostというファイル内のlambdaHandlerという関数を呼ぶ
      Handler: messagesPost.lambdaHandler
      Runtime: nodejs22.x
      Architectures:
        - x86_64
      Events:
        MessagesPost:
          Type: Api
          Properties:
            # messagesに対してのPOSTリクエストを受け付けるAPIパス
            Path: /messages
            Method: post

Outputs:
  # デプロイ後にターミナルにAPIのURLを出力
  MessagesApi:
    Description: "API Gateway endpoint URL for Prod stage for Messages function"
    Value: !Sub "https://${ServerlessRestApi}.execute-api.${AWS::Region}.amazonaws.com/Prod/messages/"
  LikesApi:
    Description: "API Gateway endpoint URL for Prod stage for Likes function"
    Value: !Sub "https://${ServerlessRestApi}.execute-api.${AWS::Region}.amazonaws.com/Prod/likes/"
```

- src/likesGet.mjs

```js
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
      // headers: {
      //   "Access-Control-Allow-Origin": "*",
      //   "Access-Control-Allow-Methods": "GET",
      // },
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
```

- src/likesPost.mjs

```js
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
      // headers: {
      //   "Access-Control-Allow-Origin": "*",
      //   "Access-Control-Allow-Methods": "POST",
      // },
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
```

## デプロイ

ビルド

```
sam build
```

デプロイ

```
sam deploy --guided
```

## デプロイする前にローカルで試したい！

以下のように、パラメーターの値を渡してコマンドを実行

```
sam local start-api --parameter-overrides "LikesTableName=like-table"
```

# CORS対応

## 失敗することを確認

WEBサイトのコードをDL

[https://github.com/JiroYoyogi/sam-api-lambda-front](https://github.com/JiroYoyogi/sam-api-lambda-front)

index.htmlの71行目付近の下記部分を自分のAPIのURLに置き換える

```js
const apiUrl = "APIのURL";
```

## コードを修正

該当部分のコメントアウトを解除する

# アクセス制限をかける

主なアクセス制限方法は、IP制限、認証（Cognitoなど）、APIキー

- template.yaml

APIにIP制限をかける

```yaml
  Api:
    OpenApiVersion: 3.0.2
    # プリフライトリクエスト対応
    Cors:
      AllowMethods: "'GET,POST,OPTIONS'"
      AllowHeaders: "'Content-Type'"
      AllowOrigin: "'*'"
    Auth:
      ResourcePolicy:
        IpRangeWhitelist:
          - "198.51.100.10/32"
```