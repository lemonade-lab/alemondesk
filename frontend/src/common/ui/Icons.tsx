export const Minimize = (props: React.SVGProps<SVGSVGElement>) => {
  return (
    <svg
      viewBox="0 0 1024 1024"
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      {...props}
    >
      <path
        d="M153.6 473.6h716.8a38.4 38.4 0 0 1 0 76.8H153.6a38.4 38.4 0 0 1 0-76.8z"
        fill="currentColor"
      ></path>
    </svg>
  )
}

export const Maximize = (props: React.SVGProps<SVGSVGElement>) => {
  return (
    <svg
      viewBox="0 0 1024 1024"
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      {...props}
    >
      <path
        d="M193.4848 819.2C171.3664 819.2 153.6 789.9136 153.6 768V409.6a61.952 61.952 0 0 1 51.2-51.2h460.8a61.952 61.952 0 0 1 51.2 51.2v358.4a60.16 60.16 0 0 1-49.5616 51.2z m11.264-51.2h460.8V409.6h-460.8z m563.2 1.8432V307.2H236.7488c-18.688 0-30.3616-6.8096-30.3616-25.6s11.6736-25.6 30.3616-25.6h531.2a62.1568 62.1568 0 0 1 51.2 51.2v462.6432c0 18.7904-7.0144 30.208-25.6 30.208S768 788.48 768 769.8432z"
        fill="currentColor"
      ></path>
    </svg>
  )
}

export const Close = (props: React.SVGProps<SVGSVGElement>) => {
  return (
    <svg
      className="shrink-0 size-4"
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="currentColor"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M18 6 6 18"></path>
      <path d="m6 6 12 12"></path>
    </svg>
  )
}
