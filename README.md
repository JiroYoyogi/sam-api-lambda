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

- template.yamlを置き換え

APIのパス変更に合わせてリソース名の整理。POSTリクエストを受け付けるAPIパス・Lambdaを作成


```yaml
AWSTemplateFormatVersion: '2010-09-09'
Transform: AWS::Serverless-2016-10-31
Description: >
  SAM Template for sam-api-lambda
  
Globals:
  Function:
    Timeout: 30

Resources:
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
```

- ファイル名変更

`hello-world/app.mjs` → `src/messagesGet.mjs`

- messagesPost.mjsを作成

下記をコピペ

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
