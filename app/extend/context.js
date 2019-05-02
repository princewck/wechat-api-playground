module.exports = {
  async currentUser() {
    const header = this.header;
    const token = await this.service.auth.verify(header['w-session']);   
    const user = await this.service.user.getByToken(token);    
    return user || null;
  }
}