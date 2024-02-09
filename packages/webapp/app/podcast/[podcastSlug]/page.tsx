import { PodcastDetail } from "@/components/PodcastDetail";

export default async function Page({ params }: { params: { podcastSlug: string } }) {
    return (
        <PodcastDetail podcastSlug={params.podcastSlug} />
    );
}