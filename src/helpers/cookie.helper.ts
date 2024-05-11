export default class CookieHelper
{
    static extractCookies(cookies: string[]): string
    {
        let result = '';

        cookies.forEach(cookie =>
        {
            result += `${cookie.split(';')[0]}; `;
        });

        return result;
    }

    static joinCookies(cookies: string, cookies2: string)
    {
        const cookieObject = {};

        for (const cookie of [...cookies.split(';'), ...cookies2.split(';')])
        {
            if (cookie.includes('='))
            {
                const name = cookie.split('=')[0].trim();
                cookieObject[name] = cookie.replace(`${name}=`, '').trim();
            }
        }

        const cookieArray = [];

        for (const key of Object.keys(cookieObject))
        {
            cookieArray.push(`${key}=${cookieObject[key]};`);
        }

        return cookieArray.join(' ');
    }

    static toObject(cookies: string): any
    {
        const cookieObject = {};

        for (const cookie of cookies.split(';'))
        {
            if (cookie.includes('='))
            {
                const name = cookie.split('=')[0].trim();
                cookieObject[name] = cookie.replace(`${name}=`, '').trim();
            }
        }

        return cookieObject;
    }
}
