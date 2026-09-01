# Fit Segmenter

เขียน Software สำหรับทำการตัดแบ่งผลจากการ Export จากพวก App ออกกำลังกายที่มี Data เยอะจะเป็น รูปยาวมากๆ ทำให้เวลาส่งเข้า AI , AI จะเห็นภาพเบลอ โดยให้ตัดตามขอบแบ่ง ของแต่ละ Section แล้วพอ Export ก็จะ Export ออกเป็นหลายๆ รูปตามที่ตัดแบ่ง

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://slice-and-stride.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/3de2e7dd-31a4-41a1-b10e-ceff051784b5).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```

## GitHub Pages

The `codex/github-pages` branch builds a client-only TanStack Start shell with
`vite.github-pages.config.ts` and deploys `dist/client` to GitHub Pages. This
static build intentionally excludes Nitro. It uses the repository base path
`/slice-and-stride/`, while normal Lovable builds continue to use `/`.

To enable the deployment, open **Settings → Pages** in GitHub and set
**Build and deployment → Source** to **GitHub Actions**. A push to the
`codex/github-pages` branch will then publish:

<https://aussadach.github.io/slice-and-stride/>
