import { Metadata, ResolvingMetadata } from 'next';

export async function generateMetadata(props: any, parent: ResolvingMetadata): Promise<Metadata> {
  return {
    title: 'Privacy Policy',
  };
}

export default function PrivacyPage() {
  return (
    <div className="font-[Inter] text-sm w-3/5 mx-auto mt-6 flex flex-col gap-4">
      <div className="font-mono text-primary text-xl">Privacy Policy</div>
      <div>Last updated February 15, 2024</div>
      <div>
        Ziggylabs (“Ziggylabs,” “we,” “our,” and/or “us”) values the privacy of individuals who use our website and
        related services (collectively, our “Services”). This privacy policy (the “Privacy Policy”) explains how we
        collect, use, and disclose information from users of our Services (“Users”). By using our Services, you agree to
        the collection, use, disclosure, and procedures this Privacy Policy describes. Beyond the Privacy Policy, your
        use of our Services is also subject to our Terms of Service (https://podverse.ai/tos).
      </div>
      <div className="font-mono text-primary text-base">Information We Collect</div>
      <div>
        We may collect a variety of information from or about you or your devices from various sources, as described
        below.
      </div>
      <div className="font-mono text-primary text-base">A. Information You Provide to Us.</div>
      <div>
        <span className="font-bold">Registration Information.</span> If you sign in with your Google or GitHub account,
        we will receive information from those services such as your name and email address.
      </div>

      <div>
        <span className="font-bold">Communications.</span> If you contact us directly, we may receive additional
        information about you, such as your name, email address, phone number, the contents of a message or attachments
        that you may send to us, and other information you choose to provide. If you contact us through our Discord
        channel, we will collect the contents of your messages and your Discord username. If you subscribe to our
        newsletter, then we will collect certain information from you, such as your email address. When we send you
        emails, we may track whether you open them to learn how to deliver a better customer experience and improve our
        Services.
      </div>

      <div>
        <span className="font-bold">Careers.</span> If you decide that you wish to apply for a job with us, you may
        submit your contact information and your resume online. We will collect the information you choose to provide on
        your resume, such as your education and employment experience. You may also apply through LinkedIn. If you do
        so, we will collect the information you make available to us on LinkedIn.
      </div>

      <div>
        <span className="font-bold">Chat Windows.</span> When you use our chat windows, we will collect all information
        you type into the chat windows, including any information about you.
      </div>

      <div className="font-mono text-primary text-base">B. Information We Collect When You Use Our Services.</div>

      <div>
        <span className="font-bold">Location Information.</span> When you use our Services, we infer your general
        location information, for example by using your internet protocol (IP) address. We also receive your precise
        location information when you grant us your permission, for example, if you want to use precise location
        information to develop or enable a tool or function that requires precise location information.
      </div>

      <div>
        <span className="font-bold">Device Information.</span> We receive information about the device and software you
        use to access our Services, including IP address, web browser type, operating system version, phone carrier and
        manufacturer, application installations, device identifiers, mobile advertising identifiers, and push
        notification tokens.
      </div>

      <div>
        <span className="font-bold">Usage Information.</span> To help us understand how you use our Services and to help
        us improve them, we automatically receive information about your interactions with our Services, like the pages
        or other content you view, the queries you issue to the system, the Agents you develop, the content you upload,
        and the dates and times of your visits.
      </div>

      <div>
        <span className="font-bold">Information from Cookies and Similar Technologies.</span> We and our third-party
        partners collect information using cookies, pixel tags, or similar technologies. Our third-party partners, such
        as analytics partners, may use these technologies to collect information about your online activities over time
        and across different services. Cookies are small text files containing a string of alphanumeric characters. We
        may use both session cookies and persistent cookies. A session cookie disappears after you close your browser. A
        persistent cookie remains after you close your browser and may be used by your browser on subsequent visits to
        our Services. Please review your web browser&apos;s “Help” file to learn how you may modify your cookie
        settings. Please note that if you delete or choose not to accept cookies from the Service, you may not be able
        to utilize the features of the Service to their fullest potential.
      </div>

      <div className="font-mono text-primary text-base">C. Information We Receive from Third Parties.</div>

      <div>
        <span className="font-bold">Information from third-party services.</span> If you choose to link our Services to
        a third-party service (e.g., Gmail, GitHub, Slack), we may receive information about you. For example, if you
        link your Google Calendar to our Services, we may access and store your Google Calendar information for the
        purposes described in this privacy policy or at the time of consent or collection. We may also collect your
        profile information, your profile photo, and your use of the third-party account that you link to our Services.
        If you wish to limit the information available to us, you should visit the privacy settings of your third-party
        accounts to learn about your options. Please refer to the privacy policy of the third-party service to learn
        more about how that third-party service will collect, use, and disclose your information.
      </div>

      <div className="font-mono text-primary text-base">How We Use the Information We Collect</div>

      <div>We use the information we collect:</div>

      <div>- To provide, maintain, improve, and enhance our Services;</div>

      <div>
        - To personalize your experience on our Services such as by providing tailored content and recommendations;
      </div>
      <div>
        - To understand and analyze how you use our Services and develop new products, services, features, and
        functionality;
      </div>
      <div>
        - To communicate with you, provide you with updates and other information relating to our Services, provide
        information that you request, respond to comments and questions, and otherwise provide customer support;
      </div>
      <div>- To facilitate the connection of third-party services or applications, such as social networks;</div>
      <div>
        - For marketing purposes, such as developing and providing promotional materials that may be relevant, valuable
        or otherwise of interest to you;
      </div>
      <div>
        - To generate anonymized, aggregate data containing only de-identified, non-personal information that we may use
        for purposes such as to publish reports;
      </div>
      <div>- To facilitate transactions and payments;</div>
      <div>- To find and prevent fraud and abuse, and respond to trust and safety issues that may arise;</div>
      <div>
        - For compliance purposes, including enforcing our Terms of Service or other legal rights, or as may be required
        by applicable laws and regulations or requested by any judicial process or governmental agency; and
      </div>
      <div>- For other purposes for which we provide specific notice at the time the information is collected.</div>

      <div className="font-mono text-primary text-base">How We Disclose the Information We Collect</div>

      <div>
        <span className="font-bold">Vendors and Service Providers.</span> We may disclose any information we receive to
        vendors and service providers in connection with the provision of our Services, including the AI provider that
        powers Podverse.ai.
      </div>

      <div>
        <span className="font-bold">User Content.</span> Our Services are social services in which you can find, enjoy,
        and share Your name, username, and other profile information may be viewable and searchable by other users. The
        content you post to our Services may be displayed on our Services and viewable by other users. Below in the
        “Your Preferences” section of this Privacy Policy, we describe the controls that you can use, along with other
        relevant settings associated with your account, to limit the sharing of certain information. We are not
        responsible for the other users&apos; use of available information, so you should carefully consider whether and
        what to post or how you identify yourself on our Services.
      </div>

      <div>
        <span className="font-bold">Social Networks and Other Online Services.</span> Our Services allow you to, upon
        your direction, disclose information to social networking services, such as Twitter, Facebook, and Instagram.
        You understand and agree that the use of your information by any social networking websites will be governed by
        the privacy policies of these third-party platforms and your settings on that platform. We encourage you to
        review their privacy policies.
      </div>

      <div>
        <span className="font-bold">Marketing.</span> We do not rent, sell, or share information about you with
        nonaffiliated companies for their direct marketing purposes, unless we have your permission.
      </div>

      <div>
        <span className="font-bold">Analytics Partners.</span> We use analytics services such as Google Analytics and
        Datadog to collect and process certain analytics data. You can learn more about Google&apos;s practices by
        visiting https://www.google.com/policies/privacy/partners/. To help us understand how you use our Services and
        to help us improve them, we automatically receive information about your interactions with our Services.
      </div>

      <div>
        <span className="font-bold">As Required By Law and Similar Disclosures.</span> We may access, preserve, and
        disclose your information if we believe doing so is required or appropriate to: (a) comply with law enforcement
        requests and legal process, such as a court order or subpoena; (b) respond to your requests; or (c) protect
        your, our, or others&apos; rights, property, or safety. For the avoidance of doubt, the disclosure of your
        information may occur if you post any objectionable content on or through our Services.
      </div>

      <div>
        <span className="font-bold">Merger, Sale, or Other Asset Transfers.</span> We may transfer your information to
        service providers, advisors, potential transactional partners, or other third parties in connection with the
        consideration, negotiation, or completion of a corporate transaction in which we are acquired by or merged with
        another company or we sell, liquidate, or transfer all or a portion of our assets. The use of your information
        following any of these events will be governed by the provisions of this Privacy Policy in effect at the time
        the applicable information was collected.
      </div>

      <div>
        <span className="font-bold">Consent.</span> We may also disclose your information with your permission.
      </div>

      <div className="font-mono text-primary text-base">Your Choices</div>

      <div>
        <span className="font-bold">Sharing Preferences.</span>
      </div>

      <div>
        - We provide you with settings to allow you to set your sharing preferences for content you post to our
        Services.
      </div>
      <div>
        - Certain information may always be publicly available to others, and other information is made publicly
        available to others by default.
      </div>
      <div>
        - To change whether certain information is publicly viewable, you can adjust the settings in your account.
      </div>
      <div>- Additional information regarding privacy settings can be found at https://podverse.ai.</div>
      <div>
        <span className="font-bold">Location Information.</span> You can prevent your device from sharing precise
        location information at any time through your device’s operating system settings.
      </div>

      <div>
        <span className="font-bold">Third Party Integrations.</span> You can disable any third-party services from our
        Services through your user dashboard. If you choose to disable a third-party service, we will delete all
        information we collected about you from that third party service.
      </div>

      <div>
        <span className="font-bold">Marketing Communications.</span> You can unsubscribe from our promotional emails via
        the link provided in the emails. Even if you opt out of receiving promotional messages from us, you will
        continue to receive administrative messages from us.
      </div>

      <div>
        <span className="font-bold">Do Not Track.</span> There is no accepted standard on how to respond to Do Not Track
        signals, and we do not respond to such signals.
      </div>

      <div>
        <span className="font-bold">
          If you choose not to provide us with information we collect, some features of our Services may not work as
          intended.
        </span>
      </div>

      <div className="font-mono text-primary text-base">Third Parties</div>

      <div>
        Our Services may contain links to other websites, products, or services that we do not own or operate. We are
        not responsible for the privacy practices of these third parties. Please be aware that this Privacy Policy does
        not apply to your activities on these third-party services or any information you disclose to these third
        parties. We encourage you to read their privacy policies before providing any information to them.
      </div>

      <div className="font-mono text-primary text-base">Security</div>

      <div>
        We make reasonable efforts to protect your information by using physical and electronic safeguards designed to
        improve the security of the information we maintain. However, as no electronic transmission or storage of
        information can be entirely secure, we can make no guarantees as to the security or privacy of your information.
      </div>

      <div className="font-mono text-primary text-base">Children&apos;s Privacy</div>

      <div>
        We do not knowingly collect, maintain, or use personal information from children under 13 years of age, and no
        part of our Services is directed to children. If you learn that a child has provided us with personal
        information in violation of this Privacy Policy, then you may alert us at support@podverse.ai.
      </div>

      <div className="font-mono text-primary text-base">International Visitors</div>

      <div>
        Our Services are hosted in the United States and intended for visitors located within the United States. If you
        choose to use our Services from the European Union or other regions of the world with laws governing data
        collection and use that may differ from U.S. law, then please note that you are transferring your personal
        information outside of those regions to the U.S. for storage and processing. We may also transfer your data from
        the U.S. to other countries or regions in connection with storage and processing of data, fulfilling your
        requests, and operating our Services. By providing any information, including personal information, on or to our
        Services, you consent to such transfer, storage, and processing.
      </div>

      <div className="font-mono text-primary text-base">Update Your Information</div>

      <div>
        You can update your account and profile information or close your account through your profile settings.
      </div>

      <div className="font-mono text-primary text-base">Changes to this Privacy Policy</div>

      <div>
        We will post any adjustments to the Privacy Policy on this page, and the revised version will be effective when
        it is posted. If we materially change the ways in which we use or disclose personal information previously
        collected from you through our Services, we will notify you through our Services, by email, or other
        communication.
      </div>

      <div className="font-mono text-primary text-base">Contact Information</div>

      <div>
        If you have any questions, comments, or concerns about our processing activities, please email us at
        support@podverse.ai.
      </div>

      <div>
        <span className="font-bold">Last Updated:</span> February 15, 2024
      </div>
    </div>
  );
}
