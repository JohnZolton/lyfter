import type { PropsWithChildren } from "react";

const MenuLayout = (props: PropsWithChildren) => {
  return (
      <div
        style={{ maxWidth: "600px", margin: "0 auto" }}
        className="rounded-lg p-2 font-semibold flex flex-col  items-center  text-center mx-auto bg-slate-800 m-2 "
      >
        {props.children}
      </div>
  );
};


export default MenuLayout