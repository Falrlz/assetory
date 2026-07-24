export default function Heading({ title, description }: { title: string; description?: string }) {
    return (
        <div className="mb-8 space-y-1">
            <h2 className="text-2xl font-bold tracking-tight">{title}</h2>
            {description && <p className="text-muted-foreground text-sm leading-relaxed">{description}</p>}
        </div>
    );
}
