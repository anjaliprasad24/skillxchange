import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="container py-32 text-center">
      <p className="font-mono text-xs uppercase tracking-widest text-primary mb-4">404</p>
      <h1 className="font-display text-5xl font-bold mb-4">Lost in the exchange</h1>
      <p className="text-muted-foreground mb-8">That page doesn't exist (yet).</p>
      <Button asChild><Link to="/">Back to home</Link></Button>
    </div>
  );
}
