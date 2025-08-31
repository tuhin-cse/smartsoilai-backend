import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '../../config/config.service';
import * as admin from 'firebase-admin';

@Injectable()
export class FirebaseService {
  private app: admin.app.App;

  constructor(private configService: ConfigService) {
    this.initializeFirebase();
  }

  private initializeFirebase() {
    try {
      // Check if Firebase app is already initialized
      this.app = admin.app();
    } catch (error) {
      // Initialize Firebase Admin SDK
      const serviceAccount = {
        type: 'service_account',
        project_id: this.configService.firebaseProjectId,
        private_key_id: this.configService.firebasePrivateKeyId,
        private_key: this.configService.firebasePrivateKey?.replace(/\\n/g, '\n'),
        client_email: this.configService.firebaseClientEmail,
        client_id: this.configService.firebaseClientId,
        auth_uri: 'https://accounts.google.com/o/oauth2/auth',
        token_uri: 'https://oauth2.googleapis.com/token',
        auth_provider_x509_cert_url: 'https://www.googleapis.com/oauth2/v1/certs',
        client_x509_cert_url: `https://www.googleapis.com/robot/v1/metadata/x509/${this.configService.firebaseClientEmail}`,
      };

      this.app = admin.initializeApp({
        credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
        projectId: this.configService.firebaseProjectId,
      });
    }
  }

  async verifyIdToken(idToken: string): Promise<admin.auth.DecodedIdToken> {
    try {
      const decodedToken = await admin.auth().verifyIdToken(idToken);
      return decodedToken;
    } catch (error) {
      console.error('Firebase ID token verification failed:', error);
      throw new UnauthorizedException('Invalid Firebase ID token');
    }
  }

  async getUserByUid(uid: string): Promise<admin.auth.UserRecord | null> {
    try {
      const userRecord = await admin.auth().getUser(uid);
      return userRecord;
    } catch (error) {
      console.error('Error fetching user from Firebase:', error);
      return null;
    }
  }
}
