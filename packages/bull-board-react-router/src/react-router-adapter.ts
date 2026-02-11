import { readFile } from "node:fs/promises";
import path from "node:path";

import type {
  AppControllerRoute,
  AppViewRoute,
  BullBoardQueues,
  ControllerHandlerReturnType,
  IServerAdapter,
  UIConfig,
} from "@bull-board/api/typings/app";
import ejs from "ejs";
import mime from "mime";
import { URLPattern } from "urlpattern-polyfill";

type ErrorHandler = (error: Error) => ControllerHandlerReturnType;

export class ReactRouterAdapter implements IServerAdapter {
  private basePath = "/";
  private bullBoardQueues?: BullBoardQueues;
  private errorHandler?: ErrorHandler;
  private uiConfig: UIConfig = {};
  private statics?: { route: string; path: string };
  private viewPath?: string;
  private entryRoute?: AppViewRoute;
  private apiRoutes: AppControllerRoute[] = [];

  public setBasePath(path: string): this {
    this.basePath = path;
    return this;
  }

  public setStaticPath(staticsRoute: string, staticsPath: string): this {
    this.statics = { route: staticsRoute, path: staticsPath };
    return this;
  }

  public setViewsPath(viewPath: string): this {
    this.viewPath = viewPath;
    return this;
  }

  public setErrorHandler(handler: ErrorHandler): this {
    this.errorHandler = handler;
    return this;
  }

  public setApiRoutes(routes: readonly AppControllerRoute[]): this {
    this.apiRoutes = [...routes];
    return this;
  }

  public setEntryRoute(routeDef: AppViewRoute): this {
    this.entryRoute = routeDef;
    return this;
  }

  public setQueues(bullBoardQueues: BullBoardQueues): this {
    this.bullBoardQueues = bullBoardQueues;
    return this;
  }

  public setUIConfig(config: UIConfig = {}): this {
    this.uiConfig = config;
    return this;
  }

  public async handleRequest(request: Request): Promise<Response> {
    if (!this.statics) {
      throw new Error(
        `Please call 'setStaticPath' before using 'handleRequest'`,
      );
    }

    const url = new URL(request.url);
    const relativePath = url.pathname.startsWith(this.basePath)
      ? url.pathname.slice(this.basePath.length) || "/"
      : url.pathname;

    if (relativePath.startsWith(this.statics.route)) {
      return this.handleStatic(this.statics, relativePath);
    }

    const found = this.findApiRoute(relativePath, request.method.toLowerCase());
    if (found) {
      return this.handleApiRoute(found.route, found.params, url, request);
    }
    return this.handleEntryPoint();
  }

  private async handleStatic(
    statics: { route: string; path: string },
    relativePath: string,
  ): Promise<Response> {
    const resolved = path.join(
      statics.path,
      relativePath.replace(statics.route, ""),
    );

    try {
      const content = await readFile(resolved);
      return new Response(content, {
        status: 200,
        headers: {
          "Content-Type":
            mime.getType(path.extname(resolved)) ?? "application/octet-stream",
        },
      });
    } catch {
      return new Response("Not Found", { status: 404 });
    }
  }

  private findApiRoute(
    relativePath: string,
    method: string,
  ): { route: AppControllerRoute; params: Record<string, string> } | null {
    for (const route of this.apiRoutes) {
      if (![route.method].flat().some((m) => m === method)) continue;

      for (const r of [route.route].flat()) {
        const pattern = new URLPattern({ pathname: r });
        const result = pattern.exec({ pathname: relativePath });
        if (result) {
          return {
            route,
            // eslint-disable-next-line @typescript-eslint/consistent-type-assertions -- URLPattern groups type is Record<string, string | undefined>
            params: result.pathname.groups as Record<string, string>,
          };
        }
      }
    }
    return null;
  }

  private async handleApiRoute(
    route: AppControllerRoute,
    params: Record<string, string>,
    url: URL,
    request: Request,
  ): Promise<Response> {
    if (!this.bullBoardQueues) {
      throw new Error(`Please call 'setQueues' before using 'handleRequest'`);
    }

    try {
      const body = await parseBody(request);

      const response = await route.handler({
        queues: this.bullBoardQueues,
        uiConfig: this.uiConfig,
        params,
        query: Object.fromEntries(url.searchParams),
        body,
        headers: Object.fromEntries(request.headers),
      });

      if (response.status === 204) {
        return new Response(null, { status: 204 });
      }
      return Response.json(response.body, {
        status: response.status,
      });
    } catch (error) {
      if (this.errorHandler && error instanceof Error) {
        const response = this.errorHandler(error);
        return Response.json(response.body, {
          status: response.status ?? 500,
        });
      }
      return Response.json({ error: "Internal Server Error" }, { status: 500 });
    }
  }

  private async handleEntryPoint(): Promise<Response> {
    if (!this.entryRoute) {
      throw new Error(
        `Please call 'setEntryRoute' before using 'handleRequest'`,
      );
    }
    if (!this.viewPath) {
      throw new Error(
        `Please call 'setViewsPath' before using 'handleRequest'`,
      );
    }

    const { name, params } = this.entryRoute.handler({
      basePath: this.basePath,
      uiConfig: this.uiConfig,
    });

    const html = await ejs.renderFile(`${this.viewPath}/${name}`, params);

    return new Response(html, {
      status: 200,
      headers: { "Content-Type": "text/html" },
    });
  }
}

async function parseBody(request: Request): Promise<Record<string, unknown>> {
  const text = await request.text();
  try {
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions -- request.json() returns any
    return JSON.parse(text) as Record<string, unknown>;
  } catch {
    return {};
  }
}
