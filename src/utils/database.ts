// محاكاة قاعدة بيانات SQLite
class MockDatabase {
  private users: any[] = [];
  private scheduledMessages: any[] = [];
  private autoReplies: any[] = [];

  // المستخدمين
  async createUser(userData: any) {
    const user = {
      id: Date.now().toString(),
      ...userData,
      createdAt: new Date().toISOString()
    };
    this.users.push(user);
    return user;
  }

  async findUserByEmail(email: string) {
    return this.users.find(user => user.email === email);
  }

  async findUserByToken(token: string) {
    return this.users.find(user => user.token === token);
  }

  async updateUser(id: string, updates: any) {
    const index = this.users.findIndex(user => user.id === id);
    if (index !== -1) {
      this.users[index] = { ...this.users[index], ...updates };
      return this.users[index];
    }
    return null;
  }

  // الرسائل المجدولة
  async createScheduledMessage(messageData: any) {
    const message = {
      id: Date.now().toString(),
      ...messageData,
      createdAt: new Date().toISOString(),
      status: 'pending'
    };
    this.scheduledMessages.push(message);
    return message;
  }

  async getScheduledMessages(userId: string) {
    return this.scheduledMessages.filter(msg => msg.userId === userId);
  }

  async updateScheduledMessage(id: string, updates: any) {
    const index = this.scheduledMessages.findIndex(msg => msg.id === id);
    if (index !== -1) {
      this.scheduledMessages[index] = { ...this.scheduledMessages[index], ...updates };
      return this.scheduledMessages[index];
    }
    return null;
  }

  async deleteScheduledMessage(id: string) {
    const index = this.scheduledMessages.findIndex(msg => msg.id === id);
    if (index !== -1) {
      this.scheduledMessages.splice(index, 1);
      return true;
    }
    return false;
  }

  // الردود التلقائية
  async createAutoReply(replyData: any) {
    const reply = {
      id: Date.now().toString(),
      ...replyData,
      createdAt: new Date().toISOString()
    };
    this.autoReplies.push(reply);
    return reply;
  }

  async getAutoReplies(userId: string) {
    return this.autoReplies.filter(reply => reply.userId === userId);
  }

  async updateAutoReply(id: string, updates: any) {
    const index = this.autoReplies.findIndex(reply => reply.id === id);
    if (index !== -1) {
      this.autoReplies[index] = { ...this.autoReplies[index], ...updates };
      return this.autoReplies[index];
    }
    return null;
  }

  async deleteAutoReply(id: string) {
    const index = this.autoReplies.findIndex(reply => reply.id === id);
    if (index !== -1) {
      this.autoReplies.splice(index, 1);
      return true;
    }
    return false;
  }
}

export const database = new MockDatabase();