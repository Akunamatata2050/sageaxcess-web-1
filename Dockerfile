FROM sageaxcess/web-base
MAINTAINER Naren J

ADD ./src/client/assets /sageaxcess-web/src/client/assets
ADD ./src/client/images /sageaxcess-web/src/client/images
ADD ./src/client/locales /sageaxcess-web/src/client/locales
ADD ./src/client/scripts /sageaxcess-web/src/client/scripts
ADD ./src/client/views /sageaxcess-web/src/client/views
ADD ./src/client/index.html /sageaxcess-web/src/client/index.html
ADD config.sh /sageaxcess-web/config.sh

RUN cd /sageaxcess-web/src && grunt build

RUN cp -a /sageaxcess-web/src/dist/. /var/www/sageaxcess-web/public

RUN chmod +x /sageaxcess-web/config.sh

EXPOSE 9000

ENTRYPOINT ["/sageaxcess-web/config.sh"]

