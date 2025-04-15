import Image from 'next/image';
export default function SomeComponent() {
    return (<div className="relative h-64 w-full">
      <Image src="https://avatars.githubusercontent.com/u/190981914?v=4" alt="Avatar" fill sizes="(max-width: 768px) 100vw, 50vw"/>
    </div>);
}
