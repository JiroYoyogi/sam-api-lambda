# AWS SAM CLIのインストール

windos、macどちらも下記ページよりインストーラーをDLしてインストール（AWS CLIのインストールが前提）

https://docs.aws.amazon.com/ja_jp/serverless-application-model/latest/developerguide/install-sam-cli.html

# 手順

1. SAMプロジェクト作成
1. ローカルPCにAPI・Lambdaを立ち上げる
1. コードの変更・テンプレート解説
1. AWSにAPI・Lambdaをデプロイ
1. POSTメソッド用の関数作成

# SAMプロジェクト作成

プロジェクト作成
 
```
sam init
```

プロジェクト名

```
sam-api-lambda
```

# ローカルPCにAPI・Lambdaを立ち上げる

ビルド

```
sam build
```

ローカルPCにAPIを立ち上げる。Dockerが必須

```
sam local start-api
```

# コードの変更・テンプレート解説

- hello-world/app.mjs

```js
    const response = {
      statusCode: 200,
      body: JSON.stringify({
        message: 'hello world',
      })
    };
```

- APIのパスを変更

`/hello` → `/messages`

- リソース名変更

`HelloWorldFunction` → `MessagesGetFunction`

- ファイル名変更

`hello-world/app.mjs` → `src/messagesGet.mjs`

- POSTメソッドを追加

以下をリソース（Resources）に追加

```yaml
  MessagesPostFunction:
    Type: AWS::Serverless::Function
    Properties:
      CodeUri: src/
      Handler: messagesPost.lambdaHandler
      Runtime: nodejs22.x
      Architectures:
        - x86_64
      Events:
        HelloWorld:
          Type: Api
          Properties:
            Path: /messages
            Method: post
```

# AWSにAPI・Lambdaをデプロイ

ビルド

```
sam build
```

デプロイ

```
sam deploy --guided
```

AWSにログインして各リソースが作成されていることを確認する

# POSTメソッド用の関数作成



- messagesPost.mjs

```js
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
```