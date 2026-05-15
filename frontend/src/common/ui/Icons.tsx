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

export const Restore = (props: React.SVGProps<SVGSVGElement>) => {
  return (
    <svg
      viewBox="0 0 1024 1024"
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      {...props}
    >
      <path
        d="M281.6 179.2h358.4a76.8 76.8 0 0 1 76.8 76.8v76.8h-51.2V256a25.6 25.6 0 0 0-25.6-25.6H281.6A25.6 25.6 0 0 0 256 256v358.4a25.6 25.6 0 0 0 25.6 25.6h76.8v51.2h-76.8a76.8 76.8 0 0 1-76.8-76.8V256a76.8 76.8 0 0 1 76.8-76.8z"
        fill="currentColor"
      ></path>
      <path
        d="M435.2 332.8h307.2A76.8 76.8 0 0 1 819.2 409.6v307.2a76.8 76.8 0 0 1-76.8 76.8H435.2a76.8 76.8 0 0 1-76.8-76.8V409.6a76.8 76.8 0 0 1 76.8-76.8z m0 51.2a25.6 25.6 0 0 0-25.6 25.6v307.2a25.6 25.6 0 0 0 25.6 25.6h307.2a25.6 25.6 0 0 0 25.6-25.6V409.6a25.6 25.6 0 0 0-25.6-25.6H435.2z"
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
