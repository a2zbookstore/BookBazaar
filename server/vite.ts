import express, { type Express } from "express";
import fs from "fs";
import path from "path";
import { createServer as createViteServer, createLogger } from "vite";
import { type Server } from "http";
import viteConfig from "../vite.config";
import { nanoid } from "nanoid";
import { injectSSRMeta } from "./ssrMetaInjector";

const viteLogger = createLogger();

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

export async function setupVite(app: Express, server: Server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true,
  };

  const vite = await createViteServer({
    ...viteConfig,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        process.exit(1);
      },
    },
    server: serverOptions,
    appType: "custom",
  });

  app.use(vite.middlewares);
  app.use("*", async (req, res, next) => {
    const url = req.originalUrl;

    try {
      const clientTemplate = path.resolve(
        import.meta.dirname,
        "..",
        "client",
        "index.html",
      );

      // always reload the index.html file from disk incase it changes
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`,
      );
      let page = await vite.transformIndexHtml(url, template);
      page = await injectSSRMeta(page, url);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e as Error);
      next(e);
    }
  });
}

export function serveStatic(app: Express) {
  const distPath = path.resolve(import.meta.dirname, "public");

  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`,
    );
  }

  // Serve all static assets EXCEPT index.html so that every HTML-page
  // request falls through to the catch-all below, which runs SSR meta injection.
  // Explicit Cache-Control headers are required: without them Google App Engine
  // defaults to "Cache-Control: private" which blocks Google's favicon service
  // from caching and displaying the site icon in search results.
  app.use(express.static(distPath, {
    index: false,
    setHeaders: (res, filePath) => {
      // Favicon / image assets — 24 h public cache so Google can index them
      if (/\.(ico|png|jpg|jpeg|svg|webp|gif)$/.test(filePath)) {
        res.set('Cache-Control', 'public, max-age=86400');
      // Hashed JS / CSS bundles — safe to cache for 1 year (content-addressed)
      } else if (/\.(js|css|woff|woff2|ttf|eot)$/.test(filePath)) {
        res.set('Cache-Control', 'public, max-age=31536000, immutable');
      // manifest.json, robots.txt, sitemap.xml — 1 h public cache
      } else if (/\.(json|txt|xml)$/.test(filePath)) {
        res.set('Cache-Control', 'public, max-age=3600');
      }
    },
  }));

  // fall through to index.html — inject SSR meta before sending
  app.use("*", async (req, res) => {
    try {
      let html = await fs.promises.readFile(
        path.resolve(distPath, "index.html"),
        "utf-8"
      );
      html = await injectSSRMeta(html, req.originalUrl);
      res.setHeader("Content-Type", "text/html");
      res.send(html);
    } catch {
      res.sendFile(path.resolve(distPath, "index.html"));
    }
  });
}
