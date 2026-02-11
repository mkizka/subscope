import { readFile } from "node:fs/promises";

import type {
  AppControllerRoute,
  AppViewRoute,
  BullBoardQueues,
  ControllerHandlerReturnType,
} from "@bull-board/api/typings/app";
import ejs from "ejs";
import { beforeEach, describe, expect, test, vi } from "vitest";

import { ReactRouterAdapter } from "./react-router-adapter.js";

vi.mock("node:fs/promises");
vi.mock("ejs");

describe("ReactRouterAdapter", () => {
  let adapter: ReactRouterAdapter;
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions -- BullBoardQueues is a complex type
  const mockQueues = new Map() as BullBoardQueues;

  beforeEach(() => {
    adapter = new ReactRouterAdapter();
    adapter.setBasePath("/dashboard");
    adapter.setStaticPath("/static", "/path/to/statics");
    adapter.setQueues(mockQueues);
  });

  describe("静的ファイルリクエスト", () => {
    test("存在する静的ファイルをリクエストした場合、ファイル内容を返す", async () => {
      // arrange
      const fileContent = Buffer.from("console.log('hello')");
      vi.mocked(readFile).mockResolvedValue(fileContent);
      const request = new Request("http://localhost/dashboard/static/app.js");

      // act
      const response = await adapter.handleRequest(request);

      // assert
      expect(response.status).toBe(200);
      expect(response.headers.get("Content-Type")).toBe("text/javascript");
      const body = await response.arrayBuffer();
      expect(Buffer.from(body)).toEqual(fileContent);
    });

    test("CSSファイルをリクエストした場合、Content-Typeがtext/cssになる", async () => {
      // arrange
      vi.mocked(readFile).mockResolvedValue(Buffer.from("body{}"));
      const request = new Request(
        "http://localhost/dashboard/static/styles.css",
      );

      // act
      const response = await adapter.handleRequest(request);

      // assert
      expect(response.status).toBe(200);
      expect(response.headers.get("Content-Type")).toBe("text/css");
    });

    test("SVGファイルをリクエストした場合、Content-Typeがimage/svg+xmlになる", async () => {
      // arrange
      vi.mocked(readFile).mockResolvedValue(Buffer.from("<svg></svg>"));
      const request = new Request("http://localhost/dashboard/static/icon.svg");

      // act
      const response = await adapter.handleRequest(request);

      // assert
      expect(response.status).toBe(200);
      expect(response.headers.get("Content-Type")).toBe("image/svg+xml");
    });

    test("PNGファイルをリクエストした場合、Content-Typeがimage/pngになる", async () => {
      // arrange
      vi.mocked(readFile).mockResolvedValue(Buffer.from("png-data"));
      const request = new Request(
        "http://localhost/dashboard/static/image.png",
      );

      // act
      const response = await adapter.handleRequest(request);

      // assert
      expect(response.status).toBe(200);
      expect(response.headers.get("Content-Type")).toBe("image/png");
    });

    test("JSONファイルをリクエストした場合、Content-Typeがapplication/jsonになる", async () => {
      // arrange
      vi.mocked(readFile).mockResolvedValue(Buffer.from("{}"));
      const request = new Request(
        "http://localhost/dashboard/static/data.json",
      );

      // act
      const response = await adapter.handleRequest(request);

      // assert
      expect(response.status).toBe(200);
      expect(response.headers.get("Content-Type")).toBe("application/json");
    });

    test(".mapファイルをリクエストした場合、Content-Typeがapplication/jsonになる", async () => {
      // arrange
      vi.mocked(readFile).mockResolvedValue(Buffer.from("{}"));
      const request = new Request(
        "http://localhost/dashboard/static/app.js.map",
      );

      // act
      const response = await adapter.handleRequest(request);

      // assert
      expect(response.status).toBe(200);
      expect(response.headers.get("Content-Type")).toBe("application/json");
    });

    test("未知の拡張子のファイルをリクエストした場合、Content-Typeがapplication/octet-streamになる", async () => {
      // arrange
      vi.mocked(readFile).mockResolvedValue(Buffer.from("data"));
      const request = new Request(
        "http://localhost/dashboard/static/file.unknownext",
      );

      // act
      const response = await adapter.handleRequest(request);

      // assert
      expect(response.status).toBe(200);
      expect(response.headers.get("Content-Type")).toBe(
        "application/octet-stream",
      );
    });

    test("存在しないファイルをリクエストした場合、404を返す", async () => {
      // arrange
      vi.mocked(readFile).mockRejectedValue(new Error("ENOENT"));
      const request = new Request(
        "http://localhost/dashboard/static/notfound.js",
      );

      // act
      const response = await adapter.handleRequest(request);

      // assert
      expect(response.status).toBe(404);
    });

    test("パストラバーサルを含むリクエストの場合、静的ファイルディレクトリ外は読み取られない", async () => {
      // arrange
      // URL parserが".."を正規化するため、handleStaticには到達せずエントリーポイントとして処理される
      const request = new Request(
        "http://localhost/dashboard/static/../../etc/passwd",
      );

      // act
      await adapter.handleRequest(request);

      // assert
      expect(readFile).not.toHaveBeenCalled();
    });
  });

  describe("APIルート", () => {
    const mockHandler = vi.fn<() => ControllerHandlerReturnType>();

    beforeEach(() => {
      mockHandler.mockReturnValue({ status: 200, body: { result: "ok" } });
      const apiRoute: AppControllerRoute = {
        method: "get",
        route: "/api/queues",
        handler: mockHandler,
      };
      adapter.setApiRoutes([apiRoute]);
    });

    test("GETリクエストがAPIルートにマッチした場合、ハンドラーの結果を返す", async () => {
      // arrange
      const request = new Request("http://localhost/dashboard/api/queues");

      // act
      const response = await adapter.handleRequest(request);

      // assert
      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body).toEqual({ result: "ok" });
    });

    test("POSTリクエストがAPIルートにマッチした場合、ハンドラーの結果を返す", async () => {
      // arrange
      mockHandler.mockReturnValue({ status: 200, body: { created: true } });
      const postRoute: AppControllerRoute = {
        method: "post",
        route: "/api/queues/:queueName/retry",
        handler: mockHandler,
      };
      adapter.setApiRoutes([postRoute]);
      const request = new Request(
        "http://localhost/dashboard/api/queues/myQueue/retry",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "retry" }),
        },
      );

      // act
      const response = await adapter.handleRequest(request);

      // assert
      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body).toEqual({ created: true });
      expect(mockHandler).toHaveBeenCalledWith(
        expect.objectContaining({
          params: { queueName: "myQueue" },
          body: { action: "retry" },
        }),
      );
    });

    test("パスパラメータ付きルートにマッチした場合、パラメータが正しく抽出される", async () => {
      // arrange
      const paramRoute: AppControllerRoute = {
        method: "get",
        route: "/api/queues/:queueName/jobs/:jobId",
        handler: mockHandler,
      };
      adapter.setApiRoutes([paramRoute]);
      const request = new Request(
        "http://localhost/dashboard/api/queues/emailQueue/jobs/123",
      );

      // act
      await adapter.handleRequest(request);

      // assert
      expect(mockHandler).toHaveBeenCalledWith(
        expect.objectContaining({
          params: { queueName: "emailQueue", jobId: "123" },
        }),
      );
    });

    test("クエリパラメータが正しく渡される場合、ハンドラーにqueryが含まれる", async () => {
      // arrange
      const request = new Request(
        "http://localhost/dashboard/api/queues?page=1&size=10",
      );

      // act
      await adapter.handleRequest(request);

      // assert
      expect(mockHandler).toHaveBeenCalledWith(
        expect.objectContaining({
          query: { page: "1", size: "10" },
        }),
      );
    });

    test("複数のHTTPメソッドを持つルートの場合、いずれのメソッドでもマッチする", async () => {
      // arrange
      const multiMethodRoute: AppControllerRoute = {
        method: ["get", "post"],
        route: "/api/queues",
        handler: mockHandler,
      };
      adapter.setApiRoutes([multiMethodRoute]);
      const getRequest = new Request("http://localhost/dashboard/api/queues");
      const postRequest = new Request("http://localhost/dashboard/api/queues", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });

      // act
      const getResponse = await adapter.handleRequest(getRequest);
      const postResponse = await adapter.handleRequest(postRequest);

      // assert
      expect(getResponse.status).toBe(200);
      expect(postResponse.status).toBe(200);
      expect(mockHandler).toHaveBeenCalledTimes(2);
    });

    test("複数のルートパターンを持つルートの場合、いずれのパターンでもマッチする", async () => {
      // arrange
      const multiRoutePattern: AppControllerRoute = {
        method: "get",
        route: ["/api/queues", "/api/queues/:queueName"],
        handler: mockHandler,
      };
      adapter.setApiRoutes([multiRoutePattern]);
      const request1 = new Request("http://localhost/dashboard/api/queues");
      const request2 = new Request(
        "http://localhost/dashboard/api/queues/myQueue",
      );

      // act
      const response1 = await adapter.handleRequest(request1);
      const response2 = await adapter.handleRequest(request2);

      // assert
      expect(response1.status).toBe(200);
      expect(response2.status).toBe(200);
      expect(mockHandler).toHaveBeenCalledTimes(2);
    });

    test("マッチしないルートにリクエストした場合、エントリーポイントにフォールバックする", async () => {
      // arrange
      const entryRoute: AppViewRoute = {
        method: "get",
        route: "/",
        handler: () => ({ name: "index.ejs", params: {} }),
      };
      adapter.setEntryRoute(entryRoute);
      adapter.setViewsPath("/views");
      vi.mocked(ejs.renderFile).mockResolvedValue("<html>rendered</html>");
      const request = new Request("http://localhost/dashboard/unknown/path");

      // act
      const response = await adapter.handleRequest(request);

      // assert
      expect(response.status).toBe(200);
      expect(response.headers.get("Content-Type")).toBe("text/html");
    });

    test("リクエストボディが不正なJSONの場合、bodyが空オブジェクトになる", async () => {
      // arrange
      const postRoute: AppControllerRoute = {
        method: "post",
        route: "/api/queues",
        handler: mockHandler,
      };
      adapter.setApiRoutes([postRoute]);
      const request = new Request("http://localhost/dashboard/api/queues", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "invalid json",
      });

      // act
      await adapter.handleRequest(request);

      // assert
      expect(mockHandler).toHaveBeenCalledWith(
        expect.objectContaining({
          body: {},
        }),
      );
    });

    test("GETリクエストの場合、bodyパースをスキップする", async () => {
      // arrange
      const request = new Request("http://localhost/dashboard/api/queues");

      // act
      await adapter.handleRequest(request);

      // assert
      expect(mockHandler).toHaveBeenCalledWith(
        expect.objectContaining({
          body: {},
        }),
      );
    });

    test("ヘッダーが正しくハンドラーに渡される場合、headersにリクエストヘッダーが含まれる", async () => {
      // arrange
      const request = new Request("http://localhost/dashboard/api/queues", {
        headers: { "X-Custom-Header": "test-value" },
      });

      // act
      await adapter.handleRequest(request);

      // assert
      expect(mockHandler).toHaveBeenCalledWith(
        expect.objectContaining({
          headers: expect.objectContaining({
            "x-custom-header": "test-value",
          }),
        }),
      );
    });
  });

  describe("queuesが未設定の場合", () => {
    test("APIルートにリクエストした場合、500エラーを返す", async () => {
      // arrange
      const adapterWithoutQueues = new ReactRouterAdapter();
      adapterWithoutQueues.setBasePath("/dashboard");
      adapterWithoutQueues.setStaticPath("/static", "/path/to/statics");
      const apiRoute: AppControllerRoute = {
        method: "get",
        route: "/api/queues",
        handler: vi.fn(),
      };
      adapterWithoutQueues.setApiRoutes([apiRoute]);
      const request = new Request("http://localhost/dashboard/api/queues");

      // act
      const response = await adapterWithoutQueues.handleRequest(request);

      // assert
      expect(response.status).toBe(500);
      const body = await response.json();
      expect(body).toEqual({ error: "Queues not configured" });
    });
  });

  describe("エラーハンドリング", () => {
    test("ハンドラーがエラーをスローしerrorHandlerが設定されている場合、errorHandlerの結果を返す", async () => {
      // arrange
      const errorRoute: AppControllerRoute = {
        method: "get",
        route: "/api/error",
        handler: () => {
          throw new Error("handler error");
        },
      };
      adapter.setApiRoutes([errorRoute]);
      adapter.setErrorHandler((error) => ({
        status: 500,
        body: { error: error.message },
      }));
      const request = new Request("http://localhost/dashboard/api/error");

      // act
      const response = await adapter.handleRequest(request);

      // assert
      expect(response.status).toBe(500);
      const body = await response.json();
      expect(body).toEqual({ error: "handler error" });
    });

    test("ハンドラーがエラーをスローしerrorHandlerが未設定の場合、デフォルトの500エラーを返す", async () => {
      // arrange
      const errorRoute: AppControllerRoute = {
        method: "get",
        route: "/api/error",
        handler: () => {
          throw new Error("handler error");
        },
      };
      adapter.setApiRoutes([errorRoute]);
      const request = new Request("http://localhost/dashboard/api/error");

      // act
      const response = await adapter.handleRequest(request);

      // assert
      expect(response.status).toBe(500);
      const body = await response.json();
      expect(body).toEqual({ error: "Internal Server Error" });
    });

    test("ハンドラーがError以外をスローしerrorHandlerが設定されている場合、デフォルトの500エラーを返す", async () => {
      // arrange
      const errorRoute: AppControllerRoute = {
        method: "get",
        route: "/api/error",
        handler: () => {
          // eslint-disable-next-line @typescript-eslint/only-throw-error -- テストのためError以外をスロー
          throw "string error";
        },
      };
      adapter.setApiRoutes([errorRoute]);
      adapter.setErrorHandler(() => ({
        status: 500,
        body: { error: "custom" },
      }));
      const request = new Request("http://localhost/dashboard/api/error");

      // act
      const response = await adapter.handleRequest(request);

      // assert
      expect(response.status).toBe(500);
      const body = await response.json();
      expect(body).toEqual({ error: "Internal Server Error" });
    });
  });

  describe("エントリーポイント", () => {
    test("エントリーポイントが設定されている場合、テンプレートをレンダリングして返す", async () => {
      // arrange
      const entryRoute: AppViewRoute = {
        method: "get",
        route: "/",
        handler: ({ basePath, uiConfig }) => ({
          name: "index.ejs",
          params: { basePath, title: uiConfig.boardTitle ?? "Bull Board" },
        }),
      };
      adapter.setEntryRoute(entryRoute);
      adapter.setViewsPath("/views");
      adapter.setUIConfig({ boardTitle: "My Board" });
      vi.mocked(ejs.renderFile).mockResolvedValue("<html>My Board</html>");
      const request = new Request("http://localhost/dashboard/");

      // act
      const response = await adapter.handleRequest(request);

      // assert
      expect(response.status).toBe(200);
      expect(response.headers.get("Content-Type")).toBe("text/html");
      const body = await response.text();
      expect(body).toBe("<html>My Board</html>");
      expect(ejs.renderFile).toHaveBeenCalledWith("/views/index.ejs", {
        basePath: "/dashboard",
        title: "My Board",
      });
    });

    test("エントリーポイントが未設定の場合、404を返す", async () => {
      // arrange
      const request = new Request("http://localhost/dashboard/");

      // act
      const response = await adapter.handleRequest(request);

      // assert
      expect(response.status).toBe(404);
    });
  });

  describe("ルートマッチング", () => {
    test("パターンと完全一致するパスの場合、マッチする", async () => {
      // arrange
      const handler = vi
        .fn<() => ControllerHandlerReturnType>()
        .mockReturnValue({
          status: 200,
          body: { matched: true },
        });
      adapter.setApiRoutes([{ method: "get", route: "/api/exact", handler }]);
      const request = new Request("http://localhost/dashboard/api/exact");

      // act
      const response = await adapter.handleRequest(request);

      // assert
      expect(response.status).toBe(200);
      expect(handler).toHaveBeenCalled();
    });

    test("パターンと部分的にしか一致しないパスの場合、マッチしない", async () => {
      // arrange
      const handler = vi.fn();
      adapter.setApiRoutes([{ method: "get", route: "/api/exact", handler }]);
      adapter.setEntryRoute({
        method: "get",
        route: "/",
        handler: () => ({ name: "index.ejs", params: {} }),
      });
      adapter.setViewsPath("/views");
      vi.mocked(ejs.renderFile).mockResolvedValue("<html></html>");
      const request = new Request("http://localhost/dashboard/api/exact/extra");

      // act
      await adapter.handleRequest(request);

      // assert
      expect(handler).not.toHaveBeenCalled();
    });

    test("パラメータ付きパターンの場合、動的セグメントにマッチする", async () => {
      // arrange
      const handler = vi
        .fn<() => ControllerHandlerReturnType>()
        .mockReturnValue({
          status: 200,
          body: {},
        });
      adapter.setApiRoutes([
        { method: "get", route: "/api/:resource/:id", handler },
      ]);
      const request = new Request("http://localhost/dashboard/api/users/456");

      // act
      await adapter.handleRequest(request);

      // assert
      expect(handler).toHaveBeenCalledWith(
        expect.objectContaining({
          params: { resource: "users", id: "456" },
        }),
      );
    });
  });

  describe("セッターメソッド", () => {
    test("setBasePathでbasePathを設定した場合、パスの解決に使用される", async () => {
      // arrange
      const handler = vi
        .fn<() => ControllerHandlerReturnType>()
        .mockReturnValue({
          status: 200,
          body: {},
        });
      const customAdapter = new ReactRouterAdapter();
      customAdapter.setBasePath("/custom-base");
      customAdapter.setStaticPath("/static", "/path/to/statics");
      customAdapter.setQueues(mockQueues);
      customAdapter.setApiRoutes([
        { method: "get", route: "/api/test", handler },
      ]);
      const request = new Request("http://localhost/custom-base/api/test");

      // act
      await customAdapter.handleRequest(request);

      // assert
      expect(handler).toHaveBeenCalled();
    });

    test("setUIConfigでUIConfigを設定した場合、エントリーポイントハンドラーに渡される", async () => {
      // arrange
      const entryHandler = vi.fn().mockReturnValue({
        name: "index.ejs",
        params: {},
      });
      adapter.setUIConfig({ boardTitle: "Test Board" });
      adapter.setEntryRoute({
        method: "get",
        route: "/",
        handler: entryHandler,
      });
      adapter.setViewsPath("/views");
      vi.mocked(ejs.renderFile).mockResolvedValue("");
      const request = new Request("http://localhost/dashboard/");

      // act
      await adapter.handleRequest(request);

      // assert
      expect(entryHandler).toHaveBeenCalledWith({
        basePath: "/dashboard",
        uiConfig: { boardTitle: "Test Board" },
      });
    });
  });
});
