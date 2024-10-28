import { Timeline } from "./_components/timeline";

export default function Home() {
  return (
    <div className="flex min-h-screen justify-center">
      <div className="flex w-full max-w-screen-xl">
        <div className="sticky top-0 h-screen flex-1 bg-gray-100 p-4">
          <nav>
            <ul className="menu menu-lg">
              <li>
                <a href="#">
                  <span className="icon-[tabler--home] size-5"></span>
                  Home
                </a>
              </li>
              <li>
                <a href="#">
                  <span className="icon-[tabler--user] size-5"></span>
                  Account
                </a>
              </li>
              <li>
                <a href="#">
                  <span className="icon-[tabler--message] size-5"></span>
                  Notifications
                </a>
              </li>
            </ul>
          </nav>
        </div>
        <div className="w-full max-w-xl overflow-y-auto p-4">
          {/* 常にスクロールバーを出すために101vh */}
          <div className="min-h-[101vh] space-y-4">
            <Timeline />
          </div>
        </div>
        <div className="sticky top-0 h-screen flex-1 bg-gray-100 p-4">
          <div>右タブ</div>
        </div>
      </div>
    </div>
  );
}
