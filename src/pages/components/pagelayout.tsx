import type { PropsWithChildren } from "react";

const PageLayout = (props: PropsWithChildren) => {
  return (
    <main className="flex h-screen justify-center">
      <div className="flex h-full w-full flex-col  md:max-w-2xl text-slate-100">
        {props.children}
      </div>
    </main>
  );
};

export default PageLayout