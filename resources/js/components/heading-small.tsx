export default function HeadingSmall({ title, description }: { title: string; description?: string }) {
    return (
        <header className="space-y-1">
            <h3 className="text-base font-semibold tracking-tight">{title}</h3>
            {description && <p className="text-muted-foreground text-sm leading-relaxed">{description}</p>}
        </header>
    );
}
