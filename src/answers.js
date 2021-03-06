const scraper = require('tiktok-scraper');
const {httpsStream, escape} = require('./utils');

const httpsPrefixRegex = /https?:\/\//i;

exports.processUrl = function (url, id, bot, isInline, proxyHost) {
    const handler = isInline ? processInlineVideoMetadata : processTextMessage;
    scraper.getVideoMeta(url)
        .then((meta) => { handler(meta, url, id, bot, proxyHost) })
        .catch((error) => { console.error("Scraper error", error.message); });
}

function processTextMessage(meta, queryUrl, chatId, bot) {
    let videoUrl = "";
    if (meta.collector && meta.collector.length > 0)  {
        videoUrl = meta.collector[0].videoUrl;
    }

    try {
        httpsStream(videoUrl, meta.headers, (stream) => {
            bot.sendVideo(chatId, stream);
        });
    } catch (e) {
        console.error("Stream error", e.message);
    }
}

function processInlineVideoMetadata(meta, queryUrl, queryId, bot, proxyHost) {
    if (meta.collector && meta.collector.length > 0)  {
        const { id, text, imageUrl, authorMeta } = meta.collector[0];
        
        const title = `*${escape(authorMeta.name)}*`;
        let description = null;
        let caption = title;
        if (text) {
            const escapedText = escape(text);
            description = escapedText;
            caption = `${caption}\n\n${escapedText}`;
        }

        bot.answerInlineQuery(queryId, [{
            "type": "video",
            "id": id,
            "video_url": `${proxyHost}/${queryUrl.replace(httpsPrefixRegex, "")}`,
            "mime_type": "video/mp4",
            "thumb_url": imageUrl,
            title,
            caption,
            "parse_mode": "MarkdownV2",
            description
        }]);
    }
}