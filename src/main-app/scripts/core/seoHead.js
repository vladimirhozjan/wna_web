import { PLAN_OPTIONS } from '../models/paymentModel.js'
import { faq } from '../../content/help/faq.js'

const SITE_URL = 'https://whatsnextaction.com'
const SITE_NAME = 'WhatsNextAction'
const OG_IMAGE = `${SITE_URL}/og-image.png`

function setMeta(attr, key, content) {
    let el = document.head.querySelector(`meta[${attr}="${key}"]`)
    if (content == null) {
        el?.remove()
        return
    }
    if (!el) {
        el = document.createElement('meta')
        el.setAttribute(attr, key)
        document.head.appendChild(el)
    }
    el.setAttribute('content', content)
}

function setCanonical(href) {
    let el = document.head.querySelector('link[rel="canonical"]')
    if (!href) {
        el?.remove()
        return
    }
    if (!el) {
        el = document.createElement('link')
        el.setAttribute('rel', 'canonical')
        document.head.appendChild(el)
    }
    el.setAttribute('href', href)
}

function setJsonLd(data) {
    let el = document.head.querySelector('script#seo-jsonld')
    if (!data) {
        el?.remove()
        return
    }
    if (!el) {
        el = document.createElement('script')
        el.id = 'seo-jsonld'
        el.type = 'application/ld+json'
        document.head.appendChild(el)
    }
    el.textContent = JSON.stringify(data)
}

function appJsonLd() {
    const offers = [
        {'@type': 'Offer', name: 'Free', price: '0', priceCurrency: 'EUR'},
        ...PLAN_OPTIONS.map(o => ({
            '@type': 'Offer',
            name: `${o.label} ${o.periodLabel}`,
            price: String(o.amount),
            priceCurrency: 'EUR',
        })),
    ]
    return {
        '@context': 'https://schema.org',
        '@type': 'SoftwareApplication',
        name: SITE_NAME,
        url: SITE_URL,
        applicationCategory: 'ProductivityApplication',
        operatingSystem: 'Web',
        offers,
    }
}

function faqJsonLd() {
    return {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: faq.map(item => ({
            '@type': 'Question',
            name: item.question,
            acceptedAnswer: {'@type': 'Answer', text: item.answer},
        })),
    }
}

const JSON_LD = {app: appJsonLd, faq: faqJsonLd}

export function applySeoHead(route) {
    const seo = route.meta.seo
    const url = seo ? `${SITE_URL}${route.path}` : null

    document.title = seo?.title || SITE_NAME
    setMeta('name', 'robots', seo ? null : 'noindex')
    setMeta('name', 'description', seo?.description ?? null)
    setCanonical(url)

    setMeta('property', 'og:type', seo ? 'website' : null)
    setMeta('property', 'og:site_name', seo ? SITE_NAME : null)
    setMeta('property', 'og:title', seo?.title ?? null)
    setMeta('property', 'og:description', seo?.description ?? null)
    setMeta('property', 'og:url', url)
    setMeta('property', 'og:image', seo ? OG_IMAGE : null)
    setMeta('property', 'og:image:width', seo ? '1200' : null)
    setMeta('property', 'og:image:height', seo ? '630' : null)
    setMeta('name', 'twitter:card', seo ? 'summary_large_image' : null)
    setMeta('name', 'twitter:title', seo?.title ?? null)
    setMeta('name', 'twitter:description', seo?.description ?? null)
    setMeta('name', 'twitter:image', seo ? OG_IMAGE : null)

    setJsonLd(seo?.jsonLd ? JSON_LD[seo.jsonLd]() : null)
}
