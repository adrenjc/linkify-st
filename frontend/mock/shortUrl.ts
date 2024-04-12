import { Request, Response } from 'express';

let shortUrls = [
  { key: '1', shortUrl: 'short.ly/abcde' },
  { key: '2', shortUrl: 'short.ly/fghij' },
  { key: '3', shortUrl: 'short.ly/klmno' },
];

function getShortUrls(req: Request, res: Response) {
  const { current = 1, pageSize = 10 } = req.query;
  const params = req.query as any;

  let dataSource = [...shortUrls];

  if (params.shortUrl) {
    dataSource = dataSource.filter((data) => data.shortUrl.includes(params.shortUrl || ''));
  }

  const result = {
    data: dataSource,
    total: shortUrls.length,
    success: true,
    pageSize: parseInt(`${pageSize}`, 10),
    current: parseInt(`${current}`, 10),
  };

  return res.json(result);
}

function postShortUrl(req: Request, res: Response) {
  const { shortUrl } = req.body;
  const newLink = {
    key: Math.random().toString(36).substr(2, 5),
    shortUrl,
  };
  shortUrls.push(newLink);
  return res.status(201).json(newLink);
}

export default {
  'GET /api/shortUrls': getShortUrls,
  'POST /api/shortUrls': postShortUrl,
};
