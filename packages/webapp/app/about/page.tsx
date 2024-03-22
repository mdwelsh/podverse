import Image from 'next/image';

export default async function Page() {
  return (
    <div className="mx-auto mt-8 w-3/5 flex flex-col gap-4">
      <div className="font-mono text-primary text-lg">About Podverse</div>
      <div>
        Hi, my name is{' '}
        <a href="https://www.mdw.la" className="text-primary underline">
          Matt
        </a>
        , and I'm the creator of Podverse. I built Podverse because I love learning things from podcasts, but often find
        it really hard to find good podcasts to listen to, or to remember which podcast episode I heard something in. I
        wanted to build a tool that leverages all of the amazing new AI tech that's out there to help me and others get
        the most out of podcasts.
      </div>
      <div>
        <Image className="float-right" src="/images/ziggylabs-logo.svg" alt="Ziggylabs logo" width={200} height={200} />
        Podverse is the first project from{' '}
        <a href="https://ziggylabs.ai" className="text-primary underline">
          Ziggylabs
        </a>
        , a new company that I've started to build AI-powered tools that help people learn and grow. Before Ziggylabs, I
        was the co-founder and Chief Architect at{' '}
        <a href="https://fixie.ai" className="text-primary underline">
          Fixie
        </a>
        , head of engineering at{' '}
        <a href="https://octo.ai" className="text-primary underline">
          OctoAI
        </a>
        , an engineering leader at{' '}
        <a href="https://apple.com" className="text-primary underline">
          Apple
        </a>{' '}
        and{' '}
        <a href="https://google.com" className="text-primary underline">
          Google
        </a>
        , and a Professor of Computer Science at{' '}
        <a href="https://harvard.edu" className="text-primary underline">
          Harvard
        </a>
        .
      </div>
      <div>
        I'd love to hear from you if you have feedback, questions, or suggestions on how to make Podverse better! Drop
        me a line at{' '}
        <a href="mailto:hello@ziggylabs.ai" className="text-primary underline">
          hello@ziggylabs.ai
        </a>
        .
      </div>
    </div>
  );
}
