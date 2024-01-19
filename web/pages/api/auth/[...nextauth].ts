import NextAuth, {Session} from "next-auth";
import type { NextApiRequest, NextApiResponse } from 'next';
import CredentialsProvider from "next-auth/providers/credentials";

import Token from "next-auth";
import { JWT } from "next-auth/jwt";
import { AdapterUser } from "next-auth/adapters";
import { User } from "next-auth";
import { tryToLogin } from "@/lib/db/auth/login";
import { EmitFlags } from "typescript";
import { EMAIL_SUFFIX } from "@/lib/controllers/auth/registerController";




export const authOptions = {
    providers: [
        CredentialsProvider({
            // The name to display on the sign in form (e.g. "Sign in with...")
            name: "Credentials",
            // `credentials` is used to generate a form on the sign in page.
            // You can specify which fields should be submitted, by adding keys to the `credentials` object.
            // e.g. domain, username, password, 2FA token, etc.
            // You can pass any HTML attribute to the <input> tag through the object.
            credentials: {
                username: { label: "Username", type: "text", placeholder: "jsmith" },
                password: { label: "Password", type: "password" }
            },
            async authorize(credentials, req) {
                // Add logic here to look up the user from the credentials supplied
                const username = credentials ? credentials.username : "a";
                const password = credentials ? credentials.password : "asdfasdf";
                console.log("trying to authorize with " + username + ", " + password);
                try {
                    const userID = await tryToLogin(username, password);
                    console.log(userID + " is the user id");
                    return {id : userID, name : username, email : username + EMAIL_SUFFIX}
                } catch {
                    console.log("error occurred")
                    return null;
                }
            }
        })
    ],
    
    secret: process.env.NEXTAUTH_SECRET,

    jwt: {
        secret: process.env.NEXTAUTH_SECRET,
        maxAge: 60 * 60 * 24 * 30,
        encryption: false,
    },

    pages: {
        signIn: "/login",
        newUser : "/register"
    },

    callbacks: {
        async jwt({token, user}) {
            if (user) {
              token.id = user.id;
              token.name = user.name;
            }
            return token;
          },

        async session({session, token}) {
          session.user = token;
          return session;
        },

        
      },


};


export default NextAuth(authOptions);