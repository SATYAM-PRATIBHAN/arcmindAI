"use client";

import { DotLottieReact } from "@lottiefiles/dotlottie-react";

export default function NotFoundAnimation() {
  return (
    <div className="flex items-center justify-center">
      <div className="w-48 h-48 sm:w-64 sm:h-64 md:w-72 md:h-72 lg:w-80 lg:h-80">
        <DotLottieReact
          src="https://lottie.host/a78410a6-e8ed-443c-9566-14734cc1d2c9/CbfCBwn8X5.lottie"
          // dark lottie animation     // src="https://lottie.host/4940dc8f-bea3-4e77-972a-204ed3649312/JoSDol1xyk.lottie"
          loop
          autoplay
        />
      </div>
    </div>
  );
}
