import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface AuthorBioProps {
  author: string;
  className?: string;
}

export function AuthorBio({ author, className }: AuthorBioProps) {
  return (
    <div className={`flex items-center gap-4 ${className}`}>
      <Avatar>
        <AvatarImage
          src={`/images/authors/${author.toLowerCase()}.jpg`}
          alt={author}
        />
        <AvatarFallback>{author[0]}</AvatarFallback>
      </Avatar>
      <div>
        <h3 className="font-medium">{author}</h3>
        <p className="text-sm text-muted-foreground">
          Amazon Seller Tools Specialist
        </p>
      </div>
    </div>
  );
}
