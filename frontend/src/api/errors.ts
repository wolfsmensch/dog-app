export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export class QueuedError extends Error {
  constructor() {
    super('Нет соединения — изменение сохранено и отправится позже');
    this.name = 'QueuedError';
  }
}
