import * as React from "react"

import { cn } from "@/lib/utils"

const Card = ({ className, children, ...props }) => (
  <div
    className={cn("rounded-xl border bg-card text-card-foreground shadow", className)}
    {...props}
  >
    {children}
  </div>
)
Card.displayName = "Card"

const CardHeader = ({ className, children, ...props }) => (
  <div className={cn("flex flex-col space-y-1.5 p-6", className)} {...props}>
    {children}
  </div>
)
CardHeader.displayName = "CardHeader"

const CardTitle = ({ className, children, ...props }) => (
  <div className={cn("font-semibold leading-none tracking-tight", className)} {...props}>
    {children}
  </div>
)
CardTitle.displayName = "CardTitle"

const CardDescription = ({ className, children, ...props }) => (
  <div className={cn("text-sm text-muted-foreground", className)} {...props}>
    {children}
  </div>
)
CardDescription.displayName = "CardDescription"

const CardContent = ({ className, children, ...props }) => (
  <div className={cn("p-6 pt-0", className)} {...props}>
    {children}
  </div>
)
CardContent.displayName = "CardContent"

const CardFooter = ({ className, children, ...props }) => (
  <div className={cn("flex items-center p-6 pt-0", className)} {...props}>
    {children}
  </div>
)
CardFooter.displayName = "CardFooter"

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent }
