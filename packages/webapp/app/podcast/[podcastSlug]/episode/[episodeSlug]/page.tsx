
export default async function Page({ params }: { params: { podcastSlug: string; episodeSlug: string } }) {
    return (
        <section className="container grid items-center gap-6 pb-8 pt-6 md:py-10">
            <div className="flex max-w-[980px] flex-col items-start gap-2">
                Hello this is podcast {params.podcastSlug} and episode {params.episodeSlug}
            </div>
        </section>
    );

}