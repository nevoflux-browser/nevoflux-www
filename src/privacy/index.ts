import { marked } from 'marked';
import type { Locale } from '~/utils/i18n';
import { DISCORD_URL, GITHUB_URL, PRIVACY_CONTACT_EMAIL, PRIVACY_LAST_UPDATED } from '~/constants';

/**
 * ⚠️ This is a STANDARD TEMPLATE privacy policy for a privacy-focused desktop browser.
 * It is NOT legal advice and MUST be reviewed — and its specifics verified against
 * NevoFlux's actual data practices — before relying on it. Update the prose below plus
 * PRIVACY_CONTACT_EMAIL and PRIVACY_LAST_UPDATED in `~/constants` as needed.
 *
 * Long-form bilingual prose lives here as Markdown and is rendered with `marked`,
 * mirroring `src/release-notes/`. Section headings use `##` (→ <h2>); the page supplies
 * the <h1> title. The "Contact" section is built in code so it can show a direct email
 * when one is configured, or fall back to the community channels otherwise.
 */

marked.setOptions({ gfm: true });

const policyMarkdown: Record<Locale, string> = {
  en: `
NevoFlux ("NevoFlux", "we", "us", or "our") is an AI-native web browser built on the
open-source Zen Browser and Firefox projects. NevoFlux is designed to be
privacy-respecting and local-first: by default your browsing happens on your device, and
we do not run servers that track the pages you visit. This Privacy Policy explains what
information NevoFlux handles, how it is used, and the choices you have. It applies to the
NevoFlux desktop application and this website.

## Information We Collect

NevoFlux is built so that the data needed to browse — your history, bookmarks, open tabs,
passwords, and settings — stays **on your device** by default. We do not collect this
information on our servers. We may handle limited information in these cases:

- **Information you provide.** If you contact us for support or feedback, we receive what you choose to send us, such as your message and contact details.
- **AI and agent requests.** When you use AI or agent features, the content you submit is processed as described in "AI and Agent Features" below.
- **Website usage.** This website may collect aggregate, non-identifying statistics to help us understand traffic. The browser itself requires no account and does not ask you to sign in.
- **Optional diagnostics.** Where crash reporting or telemetry is offered, it is opt-in and can be turned off in the browser's settings.

## How We Use Information

We use the limited information described above to operate, maintain, and improve NevoFlux
and this website; to provide the AI and agent features you request; to respond to your
support messages; and to protect NevoFlux, our users, and the public against fraud, abuse,
and security threats. We do **not** sell your personal information, and we do not use your
browsing activity to build advertising profiles.

## AI and Agent Features

NevoFlux includes AI-assisted and agent capabilities. These features are **invoked by
you** — they do not run in the background without your action. When you use one, the
content required to fulfill your request (for example, the text of a page you ask about or
an instruction you type) may be sent to the AI model provider that powers that feature so
it can generate a response. That provider processes the request under its own terms and
privacy policy. Where NevoFlux supports local or self-hosted models, you can choose to keep
this processing on your own device or infrastructure. We aim to send only the data needed
to complete your request, and we do not use the contents of your AI requests to train
models without your consent.

## Third-Party Services

NevoFlux relies on a small number of third parties to function, which may include AI model
providers (when you use AI or agent features); software update and distribution services
such as GitHub, used to deliver application releases; and underlying open-source components
from the Firefox and Zen Browser projects, which may have their own connected services
(such as safe-browsing or search) that are configurable in settings. Each third party
handles data under its own privacy policy; we encourage you to review the policies of the
services you choose to use.

## Data Retention

Information that stays on your device remains until you delete it — for example by clearing
your browsing data or uninstalling the application. For the limited information we receive,
such as support messages or aggregate website statistics, we keep it only as long as needed
for the purposes described in this policy, or as required by law.

## Your Rights and Choices

You are in control of your data. You can view, export, and delete data stored locally in
NevoFlux through the browser's settings, and you can disable optional features such as
telemetry, crash reporting, and connected services. Depending on where you live, you may
also have rights to access, correct, or delete personal information we hold about you; to
make such a request, contact us using the details below.

## Children's Privacy

NevoFlux is not directed to children under the age of 13 (or the equivalent minimum age in
your jurisdiction), and we do not knowingly collect personal information from them. If you
believe a child has provided us with personal information, please contact us so we can
address it.

## Changes to This Policy

We may update this Privacy Policy from time to time. When we make material changes we will
revise the "Last updated" date shown on this page and, where appropriate, provide
additional notice. Your continued use of NevoFlux after an update means you accept the
revised policy.
`,
  zh: `
NevoFlux（以下简称"NevoFlux""我们"）是一款基于开源项目 Zen Browser 与 Firefox 构建的
AI 原生浏览器。NevoFlux 在设计上尊重隐私、以本地优先：默认情况下，您的浏览行为发生在您
的设备上，我们不会运行追踪您所访问页面的服务器。本隐私政策说明 NevoFlux 会处理哪些信息、
如何使用这些信息，以及您拥有的选择。本政策适用于 NevoFlux 桌面应用程序及本网站。

## 我们收集的信息

NevoFlux 的设计使得浏览所需的数据——您的历史记录、书签、打开的标签页、密码和设置——默认
**保留在您的设备上**。我们不会在服务器上收集这些信息。在以下情况下，我们可能会处理有限的
信息：

- **您提供的信息。** 如果您就支持或反馈与我们联系，我们会收到您选择发送的内容，例如您的留言和联系方式。
- **AI 与智能体请求。** 当您使用 AI 或智能体功能时，您提交的内容将按下文"AI 与智能体功能"所述进行处理。
- **网站使用情况。** 本网站可能会收集聚合的、不可识别个人身份的统计数据，以帮助我们了解访问情况。浏览器本身无需账户，也不会要求您登录。
- **可选诊断信息。** 在提供崩溃报告或遥测功能的情况下，这些功能均为选择加入，并可在浏览器设置中关闭。

## 我们如何使用信息

我们使用上述有限信息，用于运营、维护和改进 NevoFlux 及本网站；提供您请求的 AI 与智能体
功能；回复您的支持留言；以及保护 NevoFlux、我们的用户和公众免受欺诈、滥用和安全威胁。我们
**不会**出售您的个人信息，也不会利用您的浏览活动构建广告画像。

## AI 与智能体功能

NevoFlux 包含 AI 辅助与智能体功能。这些功能均由**您主动触发**——在没有您操作的情况下，它们
不会在后台运行。当您使用某项功能时，完成请求所需的内容（例如您询问的页面文本，或您输入的
指令）可能会被发送给驱动该功能的 AI 模型提供方，以便生成回应。该提供方将依据其自身的条款和
隐私政策处理请求。在 NevoFlux 支持本地或自托管模型的场景下，您可以选择将此类处理保留在您
自己的设备或基础设施上。我们力求仅发送完成您请求所必需的数据，并且未经您同意，不会使用您 AI
请求的内容来训练模型。

## 第三方服务

NevoFlux 依赖少量第三方来实现其功能，可能包括：当您使用 AI 或智能体功能时的 AI 模型提供方；
用于分发应用版本的软件更新与分发服务（例如 GitHub）；以及来自 Firefox 和 Zen Browser 项目
的底层开源组件，这些组件可能拥有各自的联网服务（例如安全浏览或搜索），并可在设置中进行配置。
每一方都依据其自身的隐私政策处理数据；我们建议您查阅所使用服务的相关政策。

## 数据保留

保留在您设备上的信息会一直存在，直到您将其删除——例如清除浏览数据或卸载应用程序。对于我们
收到的有限信息，例如支持留言或聚合的网站统计数据，我们仅在本政策所述目的所需的期限内，或法律
要求的期限内予以保留。

## 您的权利与选择

您可以掌控自己的数据。您可以通过浏览器设置查看、导出和删除 NevoFlux 在本地存储的数据，也可以
关闭遥测、崩溃报告和联网服务等可选功能。根据您所在地区的不同，您可能还享有访问、更正或删除
我们所持有的有关您个人信息的权利；如需提出此类请求，请通过下方的联系方式与我们联系。

## 儿童隐私

NevoFlux 并非面向 13 周岁以下（或您所在司法辖区规定的相应最低年龄）的儿童，我们也不会在知情
的情况下收集他们的个人信息。如果您认为某位儿童向我们提供了个人信息，请与我们联系，以便我们
予以处理。

## 本政策的变更

我们可能会不时更新本隐私政策。当我们做出重大变更时，会更新本页面顶部显示的"最后更新"日期，
并在适当情况下提供额外通知。在更新后继续使用 NevoFlux，即表示您接受修订后的政策。
`,
};

/**
 * Builds the "Contact" section. When a contact email is configured it links a `mailto:`;
 * otherwise it points readers to the existing community channels. Kept pure (email passed
 * in) so both branches are unit-testable.
 */
export function contactMarkdown(locale: Locale, email: string): string {
  if (locale === 'zh') {
    return email
      ? `## 联系我们\n\n如果您对本隐私政策或您的数据处理方式有任何疑问，请发送邮件至 [${email}](mailto:${email})。`
      : `## 联系我们\n\n如果您对本隐私政策或您的数据处理方式有任何疑问，请通过我们的社区渠道与我们联系：[Discord](${DISCORD_URL}) 或 [GitHub](${GITHUB_URL})。`;
  }
  return email
    ? `## Contact\n\nIf you have questions about this Privacy Policy or how your data is handled, email us at [${email}](mailto:${email}).`
    : `## Contact\n\nIf you have questions about this Privacy Policy or how your data is handled, reach us through our community channels: [Discord](${DISCORD_URL}) or [GitHub](${GITHUB_URL}).`;
}

/** Rendered privacy policy for a locale: HTML body (incl. the Contact section) and the
 * configured last-updated date. `zh` falls back to English prose if ever left empty. */
export function getPrivacyPolicy(locale: Locale): { bodyHtml: string; lastUpdated: string } {
  const prose = policyMarkdown[locale]?.trim() || policyMarkdown.en.trim();
  const full = `${prose}\n\n${contactMarkdown(locale, PRIVACY_CONTACT_EMAIL)}`;
  return {
    bodyHtml: marked.parse(full) as string,
    lastUpdated: PRIVACY_LAST_UPDATED,
  };
}
