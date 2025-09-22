import { NextFunction, Request, Response } from 'express';

export function errorHandler(err: any, _req: Request, res: Response, _next: NextFunction) {
  // Log detalhado no servidor
  console.error(err);

  // Tratamento especial para erros do Multer (upload)
  if (err && (err.name === 'MulterError' || err.code === 'LIMIT_FILE_SIZE')) {
    const code = err.code as string | undefined;
    let status = 400;
    let message = 'Erro no upload';
    if (code === 'LIMIT_FILE_SIZE') {
      status = 413; // Payload Too Large
      message = 'Arquivo muito grande (máx 5MB)';
    } else if (code === 'LIMIT_UNEXPECTED_FILE') {
      status = 400;
      message = 'Campo de arquivo inválido';
    }
    return res.status(status).json({ message });
  }

  // Erros de tipo de arquivo rejeitado no fileFilter
  if (err && typeof err.message === 'string' && /Tipo de arquivo não suportado/i.test(err.message)) {
    return res.status(415).json({ message: err.message }); // Unsupported Media Type
  }

  // Se algum middleware/endpoit definiu status customizado
  const status = typeof err?.status === 'number' ? err.status : 500;
  const message = typeof err?.message === 'string' && err.message.trim() ? err.message : 'Internal server error';
  return res.status(status).json({ message });
}
